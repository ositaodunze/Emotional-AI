emotion_query_map = {
    "happy": "upbeat pop",
    "sad": "mellow acoustic",
    "angry": "heavy rock",
    "neutral": "chill lofi",
    "surprised": "energetic dance"
}

def get_emotion_query(emotion):
    return emotion_query_map.get(emotion, "chill lofi background")
