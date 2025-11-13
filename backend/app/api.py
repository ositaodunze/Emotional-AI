from fastapi import FastAPI,Request,APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse, JSONResponse
from pydantic import BaseModel
import spotify_recc
import spotify_api
import json
import requests #useful for recommendations from reccobeats
import joblib
import numpy as np 
import tensorflow as tf


app = FastAPI()

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

#model
ohe = joblib.load("models/mood_encoder.pkl")
scaler_y = joblib.load("models/feature_scaler.pkl")
ml_model = tf.keras.models.load_model("models/mood_to_features.h5")

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
    print("🧠 Cookies received:", request.cookies)
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
        top_artists = sp.current_user_top_artists(limit=20, time_range="medium_term")
        genres = list({genre for artist in top_artists["items"] for genre in artist["genres"]})
        return {"genres": genres[:15] or []}
    except Exception as e:
        print("Error fetching user genres:", e)
        return {"genres": []}


def predict_track_features(mood):
    X = ohe.transform([[mood]])
    pred_scaled = ml_model.predict(X)
    features = scaler_y.inverse_transform(pred_scaled)[0] 
    return features 

def call_reccobeats(feature_params,limit=20):
    payload ={
        "limit":limit, "audio_features":feature_params
    }
    try:
        response = requests.post(RECCOBEATS_BASE,json=payload,timeout=10)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print("ReccoBeats Error", e)
        return None

def convert_to_reccobeats(predicted_features,feature_names):
    params = {}
    for idx, col in enumerate(feature_names):
        key = f"target_{col}"
        params[key] = float(predicted_features[idx])
    return params

@app.post("/api/recommendation")
async def get_recommendations(request: Request):
    body = await request.json()
    emotion = body.get("emotion")
    selected_genres = body.get("genres", [])
    
    token_info_json = request.cookies.get("spotify_token_info")
    if not token_info_json:
        return JSONResponse({"error": "Not logged in"}, status_code=401)
    
    sp = spotify_api.get_spotify_client(token_info_json)
    try:
        top_artists = sp.current_user_top_artists(limit=10,time_range="medium_term")
        seed_artists = [artist["id"] for artist in top_artists["items"][:5]]
        user_genres = [genre for artist in top_artists["items"] for genre in artist["genres"]]

    except Exception as e:
        print("Failed to fetch top artists:", e)
        seed_artists = []
        user_genres = []

    combined_genres = list(set(selected_genres + user_genres))

    #tuning 
    valence = 0.8 if "happy" in emotion else 0.3 if "sad" in emotion else 0.5
    energy = 0.7 if "angry" in emotion else 0.4
    danceability = 0.8 if "happy" in emotion else 0.5

    try:
        results = sp.recommendations(seed_artists=seed_artists[:3],
            seed_genres=combined_genres[:2],
            limit=10,
            target_valence=valence,
            target_energy=energy,
            target_danceability=danceability,)
        results = sp.search()

        recommendations = [
            {
                "name": item["name"],
                "artist": item["artists"][0]["name"],
                "url": item["external_urls"]["spotify"],
                "uri": item["uri"],
            }
            for item in results["tracks"]
        ]
        if not recommendations:
            raise Exception("Empty recommendations")
        return {"recommendations": recommendations}
    
    except Exception as e:
        print("Error fetching recs",e)
        # Fallback: search a generic playlist if nothing is found
        fallback_results = sp.search(q="mood booster", type="track", limit=10)
        recommendations = [
            {
                "name": item["name"],
                "artist": item["artists"][0]["name"],
                "url": item["external_urls"]["spotify"],
                "uri": item["uri"],
            }
            for item in fallback_results["tracks"]["items"]
        ]
        return {"recommendations": recommendations}
            
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

