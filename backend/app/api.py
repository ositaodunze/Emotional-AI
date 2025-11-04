from fastapi import FastAPI,Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse, JSONResponse
from pydantic import BaseModel
from spotify_recc import get_spotify_recommendations
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

@app.get("/login")
def login():
    return RedirectResponse(spotify_api.get_auth_url())

@app.get("/callback")
def callback(request:Request):
    code = request.query_params.get("code")
    token_info = spotify_api.get_token_from_code(code)
    response = RedirectResponse("http://localhost:3000/")  # redirect to frontend
    response.set_cookie("spotify_token", token_info["access_token"], httponly=True)
    return response

@app.get("/api/me")
def get_user(request: Request):
    token = request.cookies.get("spotify_token")
    sp = spotify_api.get_spotify_client(token)
    me = sp.current_user()
    return {"display_name": me["display_name"], "email": me["email"], "product": me["product"]}

@app.post("/api/recommendations")
async def get_recommendations(request: Request):
    body = await request.json()
    emotion = body.get("emotion")
    genres = body.get("genres", [])
    token = request.cookies.get("spotify_token")

    sp = spotify_api.get_spotify_client(token)
    emotion_query = emotion_utils.get_emotion_query(emotion)
    combined_query = f"{emotion_query} {' '.join(genres)}"
    results = sp.search(q=combined_query, type="track", limit=10)

    return {"tracks": results["tracks"]["items"]}


@app.post("/emotion", tags=["emotion"])
async def get_emotion(input:EmotionInput):
    recommendation = get_spotify_recommendations(input.emotion, input.genres)
    return { "detectedemotion": input.emotion, "recommendations":recommendation }
