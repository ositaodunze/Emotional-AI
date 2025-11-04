import numpy as np
import pickle
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, confusion_matrix
import os

def train_model():
    data = np.loadtxt("data.txt")
    X = data[:, :-1]
    y = data[:, -1].astype(int)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    rf = RandomForestClassifier(
        n_estimators=500,
        max_depth=None,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1
    )
    rf.fit(X_train, y_train)

    y_pred = rf.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"Accuracy: {acc*100:.2f}%")
    print("Confusion Matrix:\n", confusion_matrix(y_test, y_pred))

    classes = sorted(os.listdir("./dataset/train"))
    with open("model.pkl", "wb") as f:
        pickle.dump({"model": rf, "classes": classes}, f)

    print("[i] Saved model.pkl")
    return rf, classes,acc
