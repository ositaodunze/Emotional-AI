from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from spotify_recc import get_spotify_recommendations


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

@app.post("/emotion", tags=["emotion"])
async def get_emotion(input:EmotionInput):
    recommendation = get_spotify_recommendations(input.emotion, input.genres)
    return { "detectedemotion": input.emotion, "recommendations":recommendation }
