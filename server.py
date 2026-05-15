from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import numpy as np
import cv2
import base64
import requests
import os
import math

app = Flask(__name__)
CORS(app)

# ── Auto-download shape predictor if missing ──────────────────────────────────
DAT_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                        'shape_predictor_68_face_landmarks.dat')

def _download_dat():
    """Download the 68-point landmark model from dlib's official source if not present."""
    if os.path.exists(DAT_PATH):
        return
    import urllib.request, bz2
    url = 'http://dlib.net/files/shape_predictor_68_face_landmarks.dat.bz2'
    bz2_path = DAT_PATH + '.bz2'
    print('[CV] Downloading shape_predictor_68_face_landmarks.dat (~100 MB)...')
    try:
        urllib.request.urlretrieve(url, bz2_path)
        with bz2.open(bz2_path, 'rb') as f_in, open(DAT_PATH, 'wb') as f_out:
            f_out.write(f_in.read())
        os.remove(bz2_path)
        print('[CV] Download complete ✓')
    except Exception as e:
        print(f'[CV] Download failed: {e}')

_download_dat()

# ── Try to load dlib for 68-point landmarks ───────────────────────────────────
try:
    import dlib
    DLIB_AVAILABLE = True
    detector = dlib.get_frontal_face_detector()
    if os.path.exists(DAT_PATH):
        predictor = dlib.shape_predictor(DAT_PATH)
        LANDMARKS_AVAILABLE = True
        print('[CV] dlib + 68-point landmarks loaded ✓')
    else:
        LANDMARKS_AVAILABLE = False
        print('[CV] dlib loaded but .dat file not found')
except ImportError:
    DLIB_AVAILABLE = False
    LANDMARKS_AVAILABLE = False
    print('[CV] dlib not available — using Haar fallback')

# ── OpenCV Haar cascades (fallback) ──────────────────────────────────────────
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
eye_cascade  = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_eye.xml')

# ── State ─────────────────────────────────────────────────────────────────────
gaze_away_frames = 0
drowsy_frames    = 0
GAZE_AWAY_THRESH = 8      # needs 8 consecutive frames looking away (~6.4s) before flagging
GAZE_X_THRESH    = 0.45   # wider tolerance — minor glances left/right won't trigger
EAR_THRESH       = 0.18   # slightly lower = harder to trigger drowsiness
DROWSY_THRESH    = 8      # needs more consecutive low-EAR frames before flagging

speed_cache: dict = {}

# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def shape_to_np(shape):
    coords = np.zeros((68, 2), dtype=int)
    for i in range(68):
        coords[i] = (shape.part(i).x, shape.part(i).y)
    return coords

def eye_aspect_ratio(eye_pts):
    A = np.linalg.norm(eye_pts[1].astype(float) - eye_pts[5].astype(float))
    B = np.linalg.norm(eye_pts[2].astype(float) - eye_pts[4].astype(float))
    C = np.linalg.norm(eye_pts[0].astype(float) - eye_pts[3].astype(float))
    return float((A + B) / (2.0 * C)) if C > 0 else 0.3

def get_gaze_offset(pts):
    """
    Returns horizontal gaze offset normalised to [-1, 1].
    Uses the midpoint between both eye centres vs the nose bridge midpoint.
    """
    left_center  = pts[36:42].mean(axis=0)
    right_center = pts[42:48].mean(axis=0)
    eye_mid_x    = (left_center[0] + right_center[0]) / 2.0
    nose_x       = pts[27][0]          # top of nose bridge
    face_w       = float(np.linalg.norm(pts[16].astype(float) - pts[0].astype(float)))
    if face_w < 1:
        return 0.0
    return float(np.clip((eye_mid_x - nose_x) / (face_w / 2.0), -1.0, 1.0))

# ─────────────────────────────────────────────────────────────────────────────
# Overlay drawing — dlib landmarks path
# ─────────────────────────────────────────────────────────────────────────────

def draw_landmarks_overlay(frame, det, pts, gaze_x, ear, attention_ok, drowsy):
    h, w = frame.shape[:2]

    # Colour palette
    GREEN  = (0, 255, 80)
    CYAN   = (0, 255, 255)
    RED    = (30, 30, 255)
    YELLOW = (0, 220, 255)
    WHITE  = (255, 255, 255)

    face_col = GREEN if attention_ok and not drowsy else RED

    # ── 1. Face bounding box (the "visual square") ────────────────────────
    x1 = max(det.left(),   0)
    y1 = max(det.top(),    0)
    x2 = min(det.right(),  w - 1)
    y2 = min(det.bottom(), h - 1)
    cv2.rectangle(frame, (x1, y1), (x2, y2), face_col, 2)

    # Corner bracket accents
    blen = 20
    for (cx, cy, sx, sy) in [(x1,y1,1,1),(x2,y1,-1,1),(x1,y2,1,-1),(x2,y2,-1,-1)]:
        cv2.line(frame, (cx, cy), (cx + sx*blen, cy), face_col, 3)
        cv2.line(frame, (cx, cy), (cx, cy + sy*blen), face_col, 3)

    # ── 2. Jaw outline (pts 0-16) ─────────────────────────────────────────
    jaw = pts[0:17]
    for i in range(len(jaw) - 1):
        cv2.line(frame, tuple(jaw[i]), tuple(jaw[i+1]), face_col, 1)

    # ── 3. Eyebrows ───────────────────────────────────────────────────────
    for seg in [pts[17:22], pts[22:27]]:
        for i in range(len(seg) - 1):
            cv2.line(frame, tuple(seg[i]), tuple(seg[i+1]), CYAN, 2)
        for p in seg:
            cv2.circle(frame, tuple(p), 2, CYAN, -1)

    # ── 4. Nose bridge + base ─────────────────────────────────────────────
    for seg in [pts[27:31], pts[30:36]]:
        for i in range(len(seg) - 1):
            cv2.line(frame, tuple(seg[i]), tuple(seg[i+1]), CYAN, 2)
    # Nose tip dot
    cv2.circle(frame, tuple(pts[30]), 5, YELLOW, -1)
    cv2.circle(frame, tuple(pts[30]), 7, YELLOW, 1)

    # ── 5. Eyes — bounding box + convex hull + iris estimate ─────────────
    eye_col = RED if drowsy else CYAN
    for eye_idx, eye_pts in enumerate([pts[36:42], pts[42:48]]):
        # Bounding box around eye region
        ex, ey = eye_pts[:, 0].min(), eye_pts[:, 1].min()
        ew = eye_pts[:, 0].max() - ex
        eh = eye_pts[:, 1].max() - ey
        pad = 4
        cv2.rectangle(frame,
                      (max(ex - pad, 0), max(ey - pad, 0)),
                      (min(ex + ew + pad, w-1), min(ey + eh + pad, h-1)),
                      eye_col, 1)

        # Convex hull of eye landmarks
        hull = cv2.convexHull(eye_pts)
        cv2.drawContours(frame, [hull], -1, eye_col, 2)

        # Landmark dots
        for p in eye_pts:
            cv2.circle(frame, tuple(p), 2, WHITE, -1)

        # Iris centre estimate
        center = tuple(eye_pts.mean(axis=0).astype(int))
        radius = max(int(ew * 0.25), 4)
        cv2.circle(frame, center, radius, eye_col, 1)
        cv2.circle(frame, center, 2, eye_col, -1)

    # ── 6. Lips ───────────────────────────────────────────────────────────
    for seg in [pts[48:60], pts[60:68]]:
        for i in range(len(seg) - 1):
            cv2.line(frame, tuple(seg[i]), tuple(seg[i+1]), CYAN, 1)
        cv2.line(frame, tuple(seg[-1]), tuple(seg[0]), CYAN, 1)

    # ── 7. Gaze arrow from nose tip ───────────────────────────────────────
    nose_tip = tuple(pts[30])
    arrow_len = 60
    gaze_end  = (int(nose_tip[0] + gaze_x * arrow_len), nose_tip[1])
    arrow_col = RED if not attention_ok else YELLOW
    cv2.arrowedLine(frame, nose_tip, gaze_end, arrow_col, 3, tipLength=0.35)

    # ── 8. Status label above face box ───────────────────────────────────
    if drowsy:
        label = 'DROWSY'
    elif not attention_ok:
        label = 'DISTRACTED'
    else:
        label = 'ATTENTIVE'
    cv2.putText(frame, label, (x1, max(y1 - 10, 14)),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, face_col, 2)

    # ── 9. HUD bar ────────────────────────────────────────────────────────
    cv2.rectangle(frame, (0, 0), (w, 30), (0, 0, 0), -1)
    cv2.putText(frame, 'DRIVESAFE CV', (8, 20),
                cv2.FONT_HERSHEY_SIMPLEX, 0.55, GREEN, 1)
    cv2.putText(frame, f'EAR:{ear:.2f}  GAZE:{gaze_x:+.2f}', (w - 200, 20),
                cv2.FONT_HERSHEY_SIMPLEX, 0.45, GREEN, 1)

    return frame


def draw_haar_overlay(frame, faces, eyes_list, attention_ok):
    """Fallback: Haar cascade boxes."""
    h, w = frame.shape[:2]
    GREEN = (0, 255, 80)
    CYAN  = (0, 255, 255)
    RED   = (30, 30, 255)

    for (fx, fy, fw, fh) in faces:
        col = GREEN if attention_ok else RED
        cv2.rectangle(frame, (fx, fy), (fx+fw, fy+fh), col, 2)
        blen = 18
        for (cx, cy, sx, sy) in [(fx,fy,1,1),(fx+fw,fy,-1,1),(fx,fy+fh,1,-1),(fx+fw,fy+fh,-1,-1)]:
            cv2.line(frame, (cx, cy), (cx+sx*blen, cy), col, 3)
            cv2.line(frame, (cx, cy), (cx, cy+sy*blen), col, 3)
        label = 'DISTRACTED' if not attention_ok else 'DRIVER DETECTED'
        cv2.putText(frame, label, (fx, max(fy-8, 14)),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, col, 2)

    for (ex, ey, ew, eh) in eyes_list:
        cv2.rectangle(frame, (ex, ey), (ex+ew, ey+eh), CYAN, 1)
        cx, cy = ex + ew//2, ey + eh//2
        cv2.circle(frame, (cx, cy), ew//3, CYAN, 1)
        cv2.circle(frame, (cx, cy), 2, CYAN, -1)

    cv2.rectangle(frame, (0, 0), (w, 30), (0, 0, 0), -1)
    cv2.putText(frame, 'DRIVESAFE CV', (8, 20),
                cv2.FONT_HERSHEY_SIMPLEX, 0.55, GREEN, 1)
    cv2.putText(frame, f'FACES:{len(faces)}', (w-110, 20),
                cv2.FONT_HERSHEY_SIMPLEX, 0.45, GREEN, 1)
    return frame

# ─────────────────────────────────────────────────────────────────────────────
# Speed limit lookup
# ─────────────────────────────────────────────────────────────────────────────

def get_speed_limit(lat, lon):
    cache_key = (round(lat, 3), round(lon, 3))
    if cache_key in speed_cache:
        return speed_cache[cache_key]
    try:
        query = (
            '[out:json][timeout:10];'
            f'way(around:75,{lat},{lon})[highway][maxspeed];'
            'out tags;'
        )
        r = requests.get('https://overpass-api.de/api/interpreter',
                         params={'data': query}, timeout=11)
        r.raise_for_status()
        for el in r.json().get('elements', []):
            ms = el.get('tags', {}).get('maxspeed', '').strip().lower()
            if not ms or ms in ('national', 'signals', 'variable', 'none'):
                continue
            val = ms.replace('mph','').replace('km/h','').replace('kph','').strip()
            if val.isdigit():
                spd = int(val)
                if 'km' in ms or 'kph' in ms:
                    spd = int(spd * 0.621371)
                speed_cache[cache_key] = spd
                print(f'[Speed] {lat:.4f},{lon:.4f} → {spd} mph (OSM tag)')
                return spd

        # Fallback: infer from road type
        query2 = (
            '[out:json][timeout:10];'
            f'way(around:50,{lat},{lon})[highway];'
            'out tags;'
        )
        r2 = requests.get('https://overpass-api.de/api/interpreter',
                          params={'data': query2}, timeout=11)
        r2.raise_for_status()
        defaults = {
            'motorway':65,'motorway_link':45,'trunk':55,'trunk_link':45,
            'primary':45,'primary_link':35,'secondary':35,'secondary_link':30,
            'tertiary':30,'tertiary_link':25,'unclassified':25,'residential':25,
            'living_street':15,'service':15,
        }
        priority = list(defaults.keys())
        best = None
        for el in r2.json().get('elements', []):
            hw = el.get('tags', {}).get('highway', '')
            if hw in defaults:
                if best is None or priority.index(hw) < priority.index(best):
                    best = hw
        if best:
            spd = defaults[best]
            speed_cache[cache_key] = spd
            print(f'[Speed] {lat:.4f},{lon:.4f} → {spd} mph ({best})')
            return spd
    except Exception as e:
        print(f'[Speed] OSM error: {e}')
    speed_cache[cache_key] = 25
    return 25

# ─────────────────────────────────────────────────────────────────────────────
# Routes
# ─────────────────────────────────────────────────────────────────────────────

@app.route('/')
def serve_index():
    return send_from_directory('static/client', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    if os.path.exists(os.path.join('static/client', path)):
        return send_from_directory('static/client', path)
    return send_from_directory('static/client', 'index.html')


@app.route('/analyze', methods=['POST'])
def analyze():
    global gaze_away_frames, drowsy_frames

    data = request.get_json()
    if not data or 'image' not in data:
        return jsonify({'error': 'no image'}), 400

    img_bytes = base64.b64decode(data['image'])
    np_arr    = np.frombuffer(img_bytes, np.uint8)
    frame     = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    if frame is None:
        return jsonify({'error': 'decode failed'}), 400

    # Resize to a consistent portrait resolution — do NOT flip
    # (the app sends front-camera frames; flipping breaks landmark coords)
    frame = cv2.resize(frame, (480, 640))

    face_detected = False
    attention_ok  = True
    drowsy        = False
    ear           = 0.3
    gaze_x        = 0.0
    events        = []

    # ── dlib path ─────────────────────────────────────────────────────────
    if DLIB_AVAILABLE:
        # Convert once; upsample=1 catches smaller/lower-quality faces
        rgb  = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        dets = detector(rgb, 1)          # ← was 0, now 1 upsampling pass

        face_detected = len(dets) > 0

        if face_detected:
            # Pick the largest detection by area
            det = max(dets, key=lambda d: (d.right()-d.left()) * (d.bottom()-d.top()))

            if LANDMARKS_AVAILABLE:
                shape = predictor(rgb, det)
                pts   = shape_to_np(shape)

                left_ear  = eye_aspect_ratio(pts[36:42])
                right_ear = eye_aspect_ratio(pts[42:48])
                ear       = (left_ear + right_ear) / 2.0
                gaze_x    = get_gaze_offset(pts)

                # Drowsiness
                if ear < EAR_THRESH:
                    drowsy_frames += 1
                    if drowsy_frames >= DROWSY_THRESH:
                        drowsy = True
                        events.append('drowsy')
                else:
                    drowsy_frames = max(0, drowsy_frames - 1)

                # Attention
                if abs(gaze_x) > GAZE_X_THRESH:
                    gaze_away_frames += 1
                    if gaze_away_frames >= GAZE_AWAY_THRESH:
                        attention_ok = False
                        events.append('distracted')
                else:
                    gaze_away_frames = max(0, gaze_away_frames - 1)

                frame = draw_landmarks_overlay(
                    frame, det, pts, gaze_x, ear, attention_ok, drowsy)

            else:
                # dlib box only (no .dat file)
                x1,y1 = max(det.left(),0), max(det.top(),0)
                x2,y2 = min(det.right(),479), min(det.bottom(),639)
                cv2.rectangle(frame, (x1,y1), (x2,y2), (0,255,80), 2)
                h2,w2 = frame.shape[:2]
                cv2.rectangle(frame,(0,0),(w2,30),(0,0,0),-1)
                cv2.putText(frame,'DRIVESAFE CV — FACE DETECTED',(8,20),
                            cv2.FONT_HERSHEY_SIMPLEX,0.5,(0,255,80),1)
        else:
            gaze_away_frames = 0
            drowsy_frames    = 0
            attention_ok     = False
            events.append('no_face')
            h2,w2 = frame.shape[:2]
            cv2.rectangle(frame,(0,0),(w2,30),(0,0,0),-1)
            cv2.putText(frame,'DRIVESAFE CV — NO FACE DETECTED',(8,20),
                        cv2.FONT_HERSHEY_SIMPLEX,0.45,(30,30,255),1)

    # ── Haar fallback ─────────────────────────────────────────────────────
    else:
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        cv2.equalizeHist(gray, gray)
        faces = face_cascade.detectMultiScale(gray, 1.05, 4, minSize=(60, 60))
        face_detected = len(faces) > 0
        eyes_list = []

        if face_detected:
            fx, fy, fw, fh = max(faces, key=lambda r: r[2]*r[3])
            roi = gray[fy:fy+fh, fx:fx+fw]
            raw_eyes = eye_cascade.detectMultiScale(roi, 1.05, 3, minSize=(15,15))
            for (ex,ey,ew,eh) in raw_eyes:
                eyes_list.append((fx+ex, fy+ey, ew, eh))

            if len(raw_eyes) >= 2:
                centers = [(ex+ew//2, ey+eh//2) for (ex,ey,ew,eh) in raw_eyes[:2]]
                avg_x   = sum(c[0] for c in centers) / 2.0
                gaze_x  = float(np.clip((avg_x - fw/2.0) / (fw/2.0), -1.0, 1.0))
                if abs(gaze_x) > GAZE_X_THRESH:
                    gaze_away_frames += 1
                    if gaze_away_frames >= GAZE_AWAY_THRESH:
                        attention_ok = False
                        events.append('distracted')
                else:
                    gaze_away_frames = max(0, gaze_away_frames - 1)
        else:
            gaze_away_frames = 0
            attention_ok     = False
            events.append('no_face')

        frame = draw_haar_overlay(frame, faces, eyes_list, attention_ok)

    _, buf = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
    annotated_b64 = base64.b64encode(buf).decode('utf-8')

    return jsonify({
        'face_detected':   face_detected,
        'attention_ok':    attention_ok,
        'drowsy':          drowsy,
        'ear':             round(ear, 3),
        'gaze_x':          round(gaze_x, 3),
        'events':          events,
        'annotated_image': annotated_b64,
    })


@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status':    'ok',
        'dlib':      DLIB_AVAILABLE,
        'landmarks': LANDMARKS_AVAILABLE,
    })


@app.route('/speed-test', methods=['GET'])
def speed_test():
    lat = request.args.get('lat', type=float)
    lon = request.args.get('lon', type=float)
    if lat is None or lon is None:
        return jsonify({'error': 'Pass ?lat=XX&lon=YY'}), 400
    return jsonify({'lat': lat, 'lon': lon, 'speed_limit_mph': get_speed_limit(lat, lon)})


@app.route('/speed', methods=['POST'])
def check_speed():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'no data'}), 400
    lat       = data.get('lat')
    lon       = data.get('lon')
    speed_mph = data.get('speed_mph', 0)
    if lat is None or lon is None:
        return jsonify({'error': 'no coords'}), 400

    limit   = get_speed_limit(lat, lon)
    overage = max(0.0, speed_mph - limit)
    deduction = 0
    if overage > 5:
        deduction = 3 if overage <= 10 else (8 if overage <= 20 else 20)

    return jsonify({
        'speed_mph':   round(speed_mph, 1),
        'speed_limit': limit,
        'over_limit':  speed_mph > limit,
        'overage':     round(overage, 1),
        'deduction':   deduction,
    })


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print('DriveSafe CV server starting...')
    print(f'  dlib:      {DLIB_AVAILABLE}')
    print(f'  landmarks: {LANDMARKS_AVAILABLE}')
    print(f'  port:      {port}')
    app.run(host='0.0.0.0', port=port, debug=False)
