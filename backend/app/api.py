from fastapi import FastAPI,Request,Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse, JSONResponse
from pydantic import BaseModel
import spotify_recc
import spotify_api
import json
import requests #useful for recommendations from reccobeats
from app.startup import verify_load_model
from contextlib import asynccontextmanager
import pandas as pd
from typing import Optional, List

#model
@asynccontextmanager
async def lifespan(app: FastAPI):
    ohe, scaler_y, music_model = verify_load_model()
    app.state.ohe = ohe
    app.state.scaler_y = scaler_y
    app.state.music_model = music_model
    yield

app = FastAPI(lifespan=lifespan)

origins = [
    "http://127.0.0.1:5173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

RECCOBEATS_BASE = "https://api.reccobeats.com/v1/track/recommendation"

class EmotionInput(BaseModel):
    emotion: str
    genres: list[str] | None = None

@app.get("/", tags=["root"])
async def read_root() -> dict:
    return {"message": "Welcome to FeedMusic."}

@app.get("/spotify/login")
def login():
    return RedirectResponse(spotify_api.get_auth_url())

@app.get("/callback")
def callback(request: Request):
    code = request.query_params.get("code")
    token_info = spotify_api.get_token_from_code(code)
    response = RedirectResponse("http://127.0.0.1:5173/")
    response.set_cookie(
        key="spotify_token_info",
        value=json.dumps(token_info),
        httponly=True,
        samesite="lax",
        secure=False
    )
    return response

@app.get("/spotify/me")
def get_user(request: Request):
    token_info_json = request.cookies.get("spotify_token_info")
    if not token_info_json:
        return JSONResponse({"error": "Not logged in"}, status_code = 401)
    sp = spotify_api.get_spotify_client(token_info_json)
    me = sp.current_user()
    return {"display_name": me["display_name"], "email": me["email"], "product": me["product"]}

@app.get("/api/genres")
def get_user_genres(request: Request):
    token_info_json = request.cookies.get("spotify_token_info")
    if not token_info_json:
        return JSONResponse({"error": "Not logged in"}, status_code=401)

    sp = spotify_api.get_spotify_client(token_info_json)

    try:
        top_artists = sp.current_user_top_artists(limit=30, time_range="short_term")
        genres = list({genre for artist in top_artists["items"] for genre in artist["genres"]})
        return {"genres": genres[:15] or []}
    except Exception as e:
        print("Error fetching user genres:", e)
        return {"genres": []}

def get_spotify_seed_tracks(sp,genres):
    try:
        top_tracks = sp.current_user_top_tracks(limit=50, time_range="short_term")
        all_tracks = top_tracks['items']

        if not genres:
            return [track['id'] for track in all_tracks[:5]]
        
        artist_ids = set()
        for track in all_tracks:
            for artist in track['artists']:
                artist_ids.add(artist['id'])
        
        # Spotify API limit: max 50 artist IDs per request
        artist_ids_list = list(artist_ids)
        
        # Batch requests if we have more than 50 artists
        artist_genre_map = {}
        if len(artist_ids_list) > 50:
            # Process in batches of 50
            for i in range(0, len(artist_ids_list), 50):
                batch = artist_ids_list[i:i+50]
                artists_data = sp.artists(batch)
                for artist in artists_data['artists']:
                    artist_genre_map[artist['id']] = set(artist['genres'])
        else:
            artists_data = sp.artists(artist_ids_list)
            for artist in artists_data['artists']:
                artist_genre_map[artist['id']] = set(artist['genres'])
            
        filtered_seed_ids = []
        target_genres = set(genres)

        for track in all_tracks:
            track_artist_ids = [artist['id'] for artist in track['artists']]
            
            # Check if any artist's genre intersects with the target genres
            is_genre_match = False
            for artist_id in track_artist_ids:
                if artist_genre_map.get(artist_id) and artist_genre_map.get(artist_id).intersection(target_genres):
                    is_genre_match = True
                    break
            
            if is_genre_match:
                filtered_seed_ids.append(track['id'])
                if len(filtered_seed_ids) >= 5:
                    break
        
        return filtered_seed_ids if filtered_seed_ids else [track['id'] for track in all_tracks[:5]] # Fallback to top 5
    except Exception as e:
        print(f"Error fetching Spotify top tracks for seeds:",e)
        return []
        
def predict_track_features(app,mood):
    ohe = app.state.ohe 
    scaler_y = app.state.scaler_y
    music_model = app.state.music_model

    mood_df = pd.DataFrame([mood],columns=['redefined_mood'])
    X = ohe.transform(mood_df)
    pred_scaled = music_model.predict(X)
    features = scaler_y.inverse_transform(pred_scaled)[0] 
    return features 

def call_reccobeats(feature_params,seed_ids,limit=20):
    filtered_keys = {"energy", "valence"}
    filtered_features = {}
    for k, v in feature_params.items():
        if k in filtered_keys:
            if k == "tempo":
                filtered_features[k] = int(round(v))
            else:
                filtered_features[k] = round(v, 4)

    seeds = ",".join(seed_ids[:5])
    payload ={
        "size":limit,"seeds":seeds, **filtered_features
    }


    print(f"DEBUG - ReccoBeats params: {payload}")
    print(f"DEBUG - Seed IDs: {seed_ids[:5]}")

    try:
        response = requests.get(RECCOBEATS_BASE,params=payload,timeout=10)
        print(f"DEBUG - Full URL: {response.url}")
        response.raise_for_status()
        data = response.json()
        print("\n===== RECCOBEATS DEBUG RESPONSE =====")
        print("Raw JSON:", json.dumps(data, indent=2))

        # If tracks are present, print the first few nicely
        if "content" in data:
            print("\nReturned tracks (first 5):")
            for t in data["content"][:5]:
                print(f"- {t.get('trackTitle', 'Unknown')} by {t.get('artists', [{}])[0].get('name', 'Unknown')}")

        else:
            print("⚠ No 'content' key in ReccoBeats response")

        return data

    except requests.exceptions.HTTPError as e:
        print(f"ReccoBeats HTTP Error: {e}")
        print(f"URL: {e.response.url if e.response else 'No URL'}")
        print(f"Response: {e.response.text if e.response else 'No response'}")
        return None
    except Exception as e:
        print("ReccoBeats Error", e)

def convert_to_reccobeats(predicted_features,feature_names):
    params = {}
    RANGE_0_1_FEATURES = ['energy', 'valence']

    for idx, col in enumerate(feature_names):
        value = float(predicted_features[idx])
        constrained_value = value

        if col in RANGE_0_1_FEATURES:
            constrained_value = max(0.0, min(1.0,value))
        elif col == "loudness":
            constrained_value = max(-60.0, min(0.0, value))
        elif col == "tempo":
            constrained_value = int(round(value))
            constrained_value = max(50, min(250, constrained_value))
        params[col] = constrained_value

    return params

@app.get("/api/recommendation")
async def get_recommendations(request: Request,emotion: str = Query(..., description="The detected or confirmed emotion"),
    genres: Optional[List[str]] = Query(None, description="List of user's top genres")):

    token_info_json = request.cookies.get("spotify_token_info")
    if not token_info_json:
        return JSONResponse({"error": "Not logged in"}, status_code=401)
    
    sp = spotify_api.get_spotify_client(token_info_json)
    seed_track_ids = get_spotify_seed_tracks(sp,genres=genres)
    if not seed_track_ids:
        return JSONResponse({"error": "Could not determine seed tracks for ReccoBeats."}, status_code=500)
    
    predicted_features = predict_track_features(app,emotion)
    scaler_y = request.app.state.scaler_y
    numeric_columns = scaler_y.feature_names_in_
    feature_params = convert_to_reccobeats(predicted_features, numeric_columns)

    rb_response = call_reccobeats(feature_params,limit=20,seed_ids = seed_track_ids)
    if not rb_response or "content" not in rb_response:
        return JSONResponse({"error": "ReccoBEats returned no tracks"}, status_code=500)
    
    #use results to search on spotify
   
    final_recommendations = []

    for track in rb_response["content"]:
        try:
            spotify_url = track.get("href")
            if not spotify_url or "track/" not in spotify_url:
                continue
            
            spotify_id = spotify_url.split("track/")[-1].split("?")[0].strip()
            if not spotify_id or len(spotify_id) < 10:
                continue 

            name = track.get("trackTitle", "Unknown Track")
            artists_data = track.get("artists",[])
            artist_name = artists_data[0].get("name") if artists_data else "Unknown Artist"

            final_recommendations.append({
                "name": name,
                "artist": artist_name,
                "url": spotify_url,
                "uri": f"spotify:track:{spotify_id}",
                })

                
        except Exception as e:
            print("Failed to search", e)
            continue
    if not final_recommendations:
            
            search_query = f"{emotion} music"
            if genres and genres:
                search_query += f" genre:{genres[0]}"

            fallback = sp.search(q=search_query,type="track",limit=10)
            final_recommendations = [
                {
                    "name": item["name"],
                    "artist": item["artists"][0]["name"],
                    "url": item["external_urls"]["spotify"],
                    "uri": item["uri"],
                }
                for item in fallback["tracks"]["items"]
            ]
    return {"recommendations": final_recommendations}
            
@app.post("/api/play")
async def play(request: Request):
    body = await request.json()
    uris = body.get("uris", [])
    token_info_json = request.cookies.get("spotify_token_info")

    if not token_info_json:
        return JSONResponse({"error": "Not logged in"}, status_code=401)

    sp = spotify_api.get_spotify_client(token_info_json)
    result = spotify_recc.start_playback(sp, uris)
    return result

@app.get("/api/current-track")
def current_track(request: Request):
    token_info_json = request.cookies.get("spotify_token_info")
    if not token_info_json:
        return JSONResponse({"error": "Not logged in"}, status_code=401)
    sp = spotify_api.get_spotify_client(token_info_json)
    return spotify_recc.get_current_track(sp)

