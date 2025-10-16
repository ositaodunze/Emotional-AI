# camdetect.py
import cv2
from typing import Generator, Tuple, Optional
from pathlib import Path

SAVE_DIR = Path("data/faces")
SAVE_DIR.mkdir(parents=True, exist_ok=True)

face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)

def detect_largest_face(gray):
    faces = face_cascade.detectMultiScale(
        gray, scaleFactor=1.1, minNeighbors=5, minSize=(80, 80)
    )
    if len(faces) == 0:
        return None
    return max(faces, key=lambda r: r[2] * r[3])

def stream_camera() -> Generator[Tuple[cv2.Mat, Optional[cv2.Mat]], None, None]:
    """
    Yields (full_frame, cropped_face or None)
    """
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        raise RuntimeError("Could not open webcam")

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        biggest = detect_largest_face(gray)

        face_roi = None
        if biggest is not None:
            x, y, w, h = biggest
            cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)
            face_roi = frame[y:y + h, x:x + w]

        yield frame, face_roi  

    cap.release()
