from fastapi import FastAPI,Request,APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse, JSONResponse
from pydantic import BaseModel
import spotify_recc
import spotify_api
import emotion_utils


app = FastAPI()

origins = [
    "http://localhost:5173",
    "localhost:5173"
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

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
def callback(request:Request):
    code = request.query_params.get("code")
    token_info = spotify_api.get_token_from_code(code)
    response = RedirectResponse("http://localhost:5173/connect")  # redirect to frontend
    response.set_cookie(key="spotify_token", value=token_info["access_token"], httponly=False,samesite="none")
    return response

@app.get("/spotify/me")
def get_user(request: Request):
    token = request.cookies.get("spotify_token")
    print("🪪 Cookie received:", token)  # Add this to confirm
    if not token:
        return JSONResponse({"error": "Not logged in"}, status_code = 401)
    sp = spotify_api.get_spotify_client(token)
    me = sp.current_user()
    return {"display_name": me["display_name"], "email": me["email"], "product": me["product"]}

@app.get("/api/genres")
def get_user_genres():
    top_genres = spotify_api.spotify_client.current_user_top_artists(limit=20)
    genres = list({genre for artist in top_genres['items'] for genre in artist['genres']})
    return {"genres": genres[:15]}
    
@app.post("/api/recommendation")
async def get_recommendations(request: Request):
    body = await request.json()
    emotion = body.get("emotion")
    selected_genres = body.get("genres", [])
    token = request.cookies.get("spotify_token")

    sp = spotify_api.get_spotify_client(token)
    emotion_query = emotion_utils.get_emotion_query(emotion)
    combined_query = f"{emotion_query} {' '.join(selected_genres)}"
    results = sp.search(q=combined_query, type="track", limit=10)

    recommendations = [
    {
        "name": item["name"],
        "artist": item["artists"][0]["name"],
        "url": item["external_urls"]["spotify"]
    }
    for item in results["tracks"]["items"]
]

    if not recommendations:
        # Fallback: search a generic playlist if nothing is found
        fallback_results = sp.search(q="mood booster", type="track", limit=10)
        recommendations = [
            {
                "name": item["name"],
                "artist": item["artists"][0]["name"],
                "url": item["external_urls"]["spotify"]
            }
            for item in fallback_results["tracks"]["items"]
        ]

    return {"recommendations": recommendations}


@app.post("/api/play")
async def play(request: Request):
    body = await request.json()
    uris = body.get("uris", [])
    token = request.cookies.get("spotify_token")

    sp = spotify_recc.get_spotify_client(token)
    result = spotify_recc.start_playback(sp, uris)
    return result

@app.get("/api/current-track")
def current_track(request: Request):
    token = request.cookies.get("spotify_token")
    sp = spotify_recc.get_spotify_client(token)
    return spotify_recc.get_current_track(sp)

