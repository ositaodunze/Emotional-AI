from deepface import DeepFace
import cv2
from camdetect import get_features

emotion = {0: "Neutral", 1: "Happy", 2:"Surprised",3: "Sad", 4: "Angry"}
cap = cv2.VideoCapture(0)
while True:
    ret, frame = cap.read()
    features = get_features(frame)
    if features is not None:
        pred = model.predict([features])   # matches training shape

    if not ret:
        break
    result = DeepFace.analyze(frame, actions=['emotion'], enforce_detection=False)
    emotion = result[0]['dominant_emotion']
    cv2.putText(frame, emotion, (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 1, (0,255,0), 2)
    cv2.imshow("Emotion Detection", frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break
cap.release()
cv2.destroyAllWindows()




