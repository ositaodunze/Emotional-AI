"""
Run this file only.  It will:
1. Train (or load) the RandomForest model
2. Start the webcam stream
3. Predict emotions in real-time
"""

from trainmodel import train_model           # training script
from face import stream_camera           # webcam capture + face ROI
from emotion_model import predict_emotion     

def main():
    # ---- 1. Train or load model ----
    rf, classes,acc = train_model()
    print(f"[i] Model ready (acc={acc:.2%}) with classes: {classes}")

    # ---- 2. Start webcam stream ----
    print("[i] Starting webcam… press Q to quit.")
    for frame, face_roi in stream_camera():
        label = predict_emotion(face_roi, rf, classes)

        #display
        import cv2
        cv2.putText(frame, label, (10, 40),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.imshow("Emotion Detection", frame)

        
        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

if __name__ == "__main__":
    main()
