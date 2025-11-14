import os
import subprocess
import joblib
import tensorflow as tf

def verify_load_model():
    os.makedirs("models",exist_ok=True)

    missing =[p for p in MODEL_PATHS.values() if not os.path.exists(p)]
    if missing:
        subprocess.run(["python", "emotionmusic.py"], check=True)

    ohe = joblib.load(MODEL_PATHS["encoder"])
    scaler_y = joblib.load(MODEL_PATHS["scaler"])
    music_model = tf.keras.models.load_model(MODEL_PATHS["model"],compile=False)
    return ohe, scaler_y, music_model

MODEL_PATHS = {
    "encoder": "models/mood_encoder.pkl",
    "scaler":  "models/feature_scaler.pkl",
    "model": "models/mood_to_features.h5"
    }