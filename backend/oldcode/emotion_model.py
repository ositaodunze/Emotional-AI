# emotion_model.py
import cv2
import numpy as np
import pickle
from deepface import DeepFace

# Load model and classes
with open("model.pkl", "rb") as f:
    data = pickle.load(f)
model = data["model"]
CLASSES = data["classes"]  

def predict_emotion(face_roi, model, classes):
    """Predict emotion using RandomForest on Facenet512 embedding"""
    if face_roi is None:
        return "No face"
    
    # Compute embedding
    emb = DeepFace.represent(face_roi, model_name="Facenet512", enforce_detection=False)
    vector = np.array(emb[0]["embedding"]).reshape(1, -1)
    
    # Predict
    pred_idx = model.predict(vector)[0]
    label = classes[int(pred_idx)] 
    return label
