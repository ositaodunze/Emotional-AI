# data_prep.py
import numpy as np
import cv2
import os
from deepface import DeepFace

data_directory = "./dataset/train"
output = []

for label_idx, emotion in enumerate(sorted(os.listdir(data_directory))):
    folder = os.path.join(data_directory, emotion)
    if not os.path.isdir(folder):
        continue
    for fname in os.listdir(folder):
        fpath = os.path.join(folder, fname)
        img = cv2.imread(fpath)
        if img is None:
            continue
        # 128-dim FaceNet embedding from DeepFace
        try:
            emb = DeepFace.represent(img, model_name="Facenet512", enforce_detection=False)
            # emb is a list of dicts
            vector = emb[0]["embedding"]
            output.append(np.append(vector, label_idx))
        except Exception as e:
            print(f"skip {fname}: {e}")

# Save feature matrix with last column = label
np.savetxt("data.txt", np.asarray(output))
print(f"Saved {len(output)} samples to data.txt")
