from fastapi import FastAPI,Request,APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse, JSONResponse
from pydantic import BaseModel
import spotify_recc
import spotify_api
import json
import requests #useful for recommendations from reccobeats
import numpy as np 
import tensorflow as tf
from app.startup import verify_load_model
from contextlib import asynccontextmanager

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

def get_spotify_seed_tracks(sp):
    try:
        top_tracks = sp.current_user_top_tracks(limit=30, time_range="short_term")
        seed_ids = [track['id'] for track in top_tracks['items']]

        if seed_ids:
            return seed_ids
    except Exception as e:
        print(f"Error fetching Spotify top tracks for seeds:",e)
        pass
        
def predict_track_features(app,mood):
    ohe = app.state.ohe 
    scaler_y = app.state.scaler_y
    music_model = app.state.music_model

    X = ohe.transform([[mood]])
    pred_scaled = music_model.predict(X)
    features = scaler_y.inverse_transform(pred_scaled)[0] 
    return features 

def call_reccobeats(feature_params,seed_ids,limit=20):
    filtered_keys = {"energy", "valence", "tempo", "loudness"}
    filtered_features = {}
    for k, v in feature_params.items():
        if k in filtered_keys:
            if k == "tempo":
                filtered_features[k] = int(round(v))
            else:
                filtered_features[k] = round(v, 4)

    seeds_csv = ",".join(seed_ids[:5])
    payload ={
        "size":limit,"seeds":seeds_csv, **filtered_features
    }


    print(f"DEBUG - ReccoBeats params: {payload}")
    print(f"DEBUG - Seed IDs: {seed_ids[:5]}")

    try:
        response = requests.get(RECCOBEATS_BASE,params=payload,timeout=10)
        print(f"DEBUG - Full URL: {response.url}")
        response.raise_for_status()
        return response.json()
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

@app.post("/api/recommendation")
async def get_recommendations(request: Request):
    body = await request.json()
    emotion = body.get("emotion")

    token_info_json = request.cookies.get("spotify_token_info")
    if not token_info_json:
        return JSONResponse({"error": "Not logged in"}, status_code=401)
    
    sp = spotify_api.get_spotify_client(token_info_json)
    seed_track_ids = get_spotify_seed_tracks(sp)
    if not seed_track_ids:
        return JSONResponse({"error": "Could not determine seed tracks for ReccoBeats."}, status_code=500)
    
    predicted_features = predict_track_features(app,emotion)
    scaler_y = request.app.state.scaler_y
    numeric_columns = scaler_y.feature_names_in_
    feature_params = convert_to_reccobeats(predicted_features, numeric_columns)

    rb_response = call_reccobeats(feature_params,limit=20,seed_ids = seed_track_ids)
    if not rb_response or "tracks" not in rb_response:
        return JSONResponse({"error": "ReccoBEats returned no tracks"}, status_code=500)
    
    track_names = [t["name"] for t in rb_response["tracks"]]
    #use results to search on spotify
   
    final_recommendations = []

    for name in track_names:
        try:
            results = sp.search(q=name, type="track", limit=1)
            items = results["tracks"]["items"]
            if items:
                item = items[0]
                final_recommendations.append({
                "name": item["name"],
                "artist": item["artists"][0]["name"],
                "url": item["external_urls"]["spotify"],
                "uri": item["uri"],
                })

        except Exception as e:
            print("Failed to search", e)
    if not final_recommendations:
            fallback = sp.search(q="mood booster",type="track",limit=10)
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

