import os
from groq import Groq
import json

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def prompt_llm(prompt,max_tokens=300):
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=max_tokens,
            temperature=0.7
        )
        return response.choices[0].message.content
    except Exception as e:
        print("LLM Error:", e)
        return None
    
def expand_similar_artists(artist_names: list[str]):
    if not artist_names:
        return []

    prompt = f"""
You are a music recommendation expert.

The user likes these artists:
{artist_names}

Return  EXACTLY a JSON array of 15 additional artists with a similar sound, 
vocal texture, emotional tone, and production style.

Rules:
- Only return popular, modern, mainstream artists.
- Focus on artists whose songs match similar vibes.
- Return ONLY a JSON array of names. No explanations.
- Example format:
["Artist A", "Artist B", "Artist C"]
    """

    raw = prompt_llm(prompt)
    if not raw:
        return []

    try:
        data = json.loads(raw)
        if isinstance(data, list):
            return [str(x) for x in data]
        return []
    except:
        # Fallback naive parsing
        return [a.strip("-• ") for a in raw.split("\n") if a.strip()]
    
def get_artist_feature_profile(artist_name: str):
    prompt = f"""
Estimate the average musical features for the artist "{artist_name}".
Return ONLY a valid JSON dict:
{{
  "energy": 0-1,
  "valence": 0-1,
  "danceability": 0-1,
  "instrumentalness": 0-1,
  "tempo": BPM number,
  "loudness": negative dB
}}

Rules:
- Use typical values for their genre and songs.
- Output ONLY a JSON with those 6 keys.
- No text outside the dict.
"""

    raw = prompt_llm(prompt)
    if not raw:
        return None

    try:
        return json.loads(raw)
    except:
        return None
    
def combine_artist_profiles(profiles: list[dict]):
    if not profiles:
        return None

    keys = ["energy", "valence", "danceability", "instrumentalness", "tempo", "loudness"]
    combined = {k: 0 for k in keys}

    for prof in profiles:
        for k in keys:
            combined[k] += prof.get(k, 0)

    n = len(profiles)
    for k in keys:
        combined[k] /= n

    return combined

def blend_features(emotion_vec: dict, artist_vec: dict, emotion_weight=0.7):

    if not artist_vec:
        return emotion_vec  

    final = {}
    for k in emotion_vec:
        if k in artist_vec:
            final[k] = emotion_weight * emotion_vec[k] + (1 - emotion_weight) * artist_vec[k]
        else:
            final[k] = emotion_vec[k]

    return final

def suggest_tracks_for_artist_and_mood(artist_names, emotion):
    prompt = f"""
Suggest 15 songs that fit the emotion "{emotion}" and match the style
of these artists: {artist_names}.

Rules:
- Choose songs by the same artists OR artists with similar sound.
- Songs must match the emotional tone.
- Return only a JSON list of dicts with fields:
  {{
    "track": "...",
    "artist": "..."
  }}

No explanations.
"""

    raw = prompt_llm(prompt, max_tokens=450)
    if not raw:
        return []

    try:
        return json.loads(raw)
    except:
        # fallback simple parsing
        results = []
        for line in raw.split("\n"):
            if "-" in line:
                parts = line.split("-")
                results.append({"track": parts[1].strip(), "artist": parts[0].strip()})
        return results
