import cv2
import numpy as np
import time
from pathlib import Path

# ---- settings
SAVE_DIR = Path("data/faces")
SAVE_DIR.mkdir(parents=True, exist_ok=True)

# built-in lightweight detector
face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)

def detect_largest_face(gray):
    faces = face_cascade.detectMultiScale(
        gray, scaleFactor=1.1, minNeighbors=5, minSize=(80, 80)
    )
    if len(faces) == 0:
        return None
    # pick largest by area
    return max(faces, key=lambda r: r[2] * r[3])

def center_crop_square(img):
    h, w = img.shape[:2]
    m = min(h, w)
    y0 = (h - m) // 2
    x0 = (w - m) // 2
    return img[y0:y0+m, x0:x0+m]

def main():
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("❌ Could not open webcam")
        return

    last = time.time()
    fps = 0.0
    saved_count = 0

    print("[i] Controls: 's' = save face, 'q' = quit")
    while True:
        ok, frame = cap.read()
        if not ok:
            break

        # FPS calc
        now = time.time()
        fps = 0.9 * fps + 0.1 * (1.0 / max(now - last, 1e-6))
        last = now

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        biggest = detect_largest_face(gray)

        if biggest is not None:
            x, y, w, h = biggest
            cv2.rectangle(frame, (x,y), (x+w, y+h), (0,255,0), 2)

            # for save preview
            face_roi = frame[y:y+h, x:x+w]
            face_preview = cv2.resize(face_roi, (160,160))
            frame[10:10+160, 10:10+160] = face_preview

            cv2.putText(frame, "Face detected", (x, y-10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0,255,0), 2)
        else:
            cv2.putText(frame, "No face", (10, 30),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0,0,255), 2)

        cv2.putText(frame, f"FPS: {fps:.1f}", (frame.shape[1]-150, 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255,255,255), 2)
        cv2.putText(frame, "s=save face  q=quit", (10, frame.shape[0]-15),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255,255,255), 2)

        cv2.imshow("OpenCV Face Detection (Phase 1)", frame)
        key = cv2.waitKey(1) & 0xFF

        if key == ord('s') and biggest is not None:
            # save cropped face for dataset building
            x, y, w, h = biggest
            face = frame[y:y+h, x:x+w]
            face = center_crop_square(face)
            ts = int(time.time() * 1000)
            out_path = SAVE_DIR / f"face_{ts}.jpg"
            cv2.imwrite(str(out_path), face)
            saved_count += 1
            print(f"[+] saved {out_path} (total: {saved_count})")

        elif key == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
