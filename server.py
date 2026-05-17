from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import numpy as np
import cv2
import base64
import requests as http_requests
import os

app = Flask(__name__)
CORS(app)

# ── OpenCV Haar cascades ──────────────────────────────────────────────────────
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
eye_cascade  = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_eye.xml')

# ── Attention tracking ────────────────────────────────────────────────────────
gaze_away_frames = 0
GAZE_AWAY_THRESH = 4
GAZE_X_THRESH    = 0.35

# ── Speed limit cache ─────────────────────────────────────────────────────────
speed_cache: dict = {}

# ─────────────────────────────────────────────────────────────────────────────
# Speed limit lookup
# ─────────────────────────────────────────────────────────────────────────────

def get_speed_limit(lat, lon):
    cache_key = (round(lat, 3), round(lon, 3))
    if cache_key in speed_cache:
        return speed_cache[cache_key]
    try:
        query = (
            '[out:json][timeout:8];'
            f'way(around:50,{lat},{lon})[highway][maxspeed];'
            'out tags;'
        )
        response = http_requests.get(
            'https://overpass-api.de/api/interpreter',
            params={'data': query},
            timeout=9
        )
        response.raise_for_status()
        elements = response.json().get('elements', [])
        for el in elements:
            maxspeed = el.get('tags', {}).get('maxspeed', '').strip()
            if not maxspeed or maxspeed.lower() in ('national', 'signals'):
                continue
            ms = maxspeed.lower().replace('mph','').replace('km/h','').replace('kph','').strip()
            if ms.isdigit():
                speed = int(ms)
                if 'km' in maxspeed.lower() or 'kph' in maxspeed.lower():
                    speed = int(speed * 0.621371)
                speed_cache[cache_key] = speed
                return speed

        # Fallback: infer from road type
        query2 = (
            '[out:json][timeout:8];'
            f'way(around:30,{lat},{lon})[highway];'
            'out tags;'
        )
        r2 = http_requests.get(
            'https://overpass-api.de/api/interpreter',
            params={'data': query2},
            timeout=9
        )
        r2.raise_for_status()
        highway_defaults = {
            'motorway': 65, 'trunk': 55, 'primary': 45,
            'secondary': 35, 'tertiary': 30, 'residential': 25,
            'living_street': 15, 'service': 15,
        }
        for el in r2.json().get('elements', []):
            hw = el.get('tags', {}).get('highway', '')
            if hw in highway_defaults:
                spd = highway_defaults[hw]
                speed_cache[cache_key] = spd
                return spd

        speed_cache[cache_key] = 25
        return 25
    except Exception as e:
        print(f'[Speed] OSM lookup failed: {e}')
        return 25

# ─────────────────────────────────────────────────────────────────────────────
# CV overlay
# ─────────────────────────────────────────────────────────────────────────────

def draw_overlay(frame, faces, eyes_list, gaze_offset, attention_ok):
    h, w = frame.shape[:2]
    GREEN  = (0, 255, 80)
    CYAN   = (0, 255, 255)
    RED    = (0, 60, 255)
    YELLOW = (0, 220, 255)

    # Scanlines
    scan = frame.copy()
    for y in range(0, h, 4):
        cv2.line(scan, (0, y), (w, y), (0, 0, 0), 1)
    cv2.addWeighted(scan, 0.12, frame, 0.88, 0, frame)

    for (fx, fy, fw, fh) in faces:
        col = GREEN if attention_ok else RED
        cv2.rectangle(frame, (fx, fy), (fx+fw, fy+fh), col, 2)
        # Corner brackets
        blen = 18
        for (x1, y1, dx, dy) in [(fx,fy,1,1),(fx+fw,fy,-1,1),(fx,fy+fh,1,-1),(fx+fw,fy+fh,-1,-1)]:
            cv2.line(frame, (x1,y1), (x1+dx*blen, y1), col, 2)
            cv2.line(frame, (x1,y1), (x1, y1+dy*blen), col, 2)
        label = 'DISTRACTED' if not attention_ok else 'DRIVER DETECTED'
        cv2.putText(frame, label, (fx, fy-8), cv2.FONT_HERSHEY_SIMPLEX, 0.45, col, 1)

    # Eyes
    for (ex, ey, ew, eh) in eyes_list:
        cx, cy = ex+ew//2, ey+eh//2
        cv2.circle(frame, (cx, cy), ew//2, CYAN, 1)
        cv2.circle(frame, (cx, cy), 2, CYAN, -1)

    # Nose — removed (haarcascade_mcs_nose not in headless OpenCV)

    # Gaze arrow
    if faces and gaze_offset is not None:
        fx, fy, fw, fh = faces[0]
        cx, cy = fx+fw//2, fy+fh//2
        gx = int(cx + gaze_offset[0] * 60)
        gy = int(cy + gaze_offset[1] * 25)
        acol = RED if not attention_ok else YELLOW
        cv2.arrowedLine(frame, (cx, cy), (gx, gy), acol, 2, tipLength=0.3)
        # Gaze label
        gaze_label = f'GAZE {gaze_offset[0]:+.2f}'
        cv2.putText(frame, gaze_label, (fx, fy+fh+16),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.4, acol, 1)

    # HUD bar
    cv2.rectangle(frame, (0, 0), (w, 28), (0, 0, 0), -1)
    cv2.putText(frame, 'DRIVESAFE CV v2.0', (8, 18),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, GREEN, 1)
    cv2.putText(frame, f'FACES:{len(faces)}', (w-100, 18),
                cv2.FONT_HERSHEY_SIMPLEX, 0.45, GREEN, 1)

    return frame

# ─────────────────────────────────────────────────────────────────────────────
# Routes
# ─────────────────────────────────────────────────────────────────────────────

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'version': '2.0'})

@app.route('/analyze', methods=['POST'])
def analyze():
    global gaze_away_frames

    data = request.get_json()
    if not data or 'image' not in data:
        return jsonify({'error': 'No image provided'}), 400

    img_bytes = base64.b64decode(data['image'])
    np_arr    = np.frombuffer(img_bytes, np.uint8)
    frame     = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    if frame is None:
        return jsonify({'error': 'Could not decode image'}), 400

    frame = cv2.resize(frame, (480, 640))
    frame = cv2.flip(frame, 1)

    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    cv2.equalizeHist(gray, gray)

    faces = face_cascade.detectMultiScale(gray, 1.05, 3, minSize=(40, 40))

    face_detected = len(faces) > 0
    attention_ok  = True
    events        = []
    eyes_list     = []
    gaze_offset   = None
    gaze_x        = 0.0

    if face_detected:
        fx, fy, fw, fh = faces[0]
        roi_gray = gray[fy:fy+fh, fx:fx+fw]

        # Eyes
        raw_eyes = eye_cascade.detectMultiScale(roi_gray, 1.05, 2, minSize=(10, 10))
        for (ex, ey, ew, eh) in raw_eyes:
            eyes_list.append((fx+ex, fy+ey, ew, eh))

        # Gaze from eye positions
        if len(raw_eyes) >= 2:
            centers = [(ex+ew//2, ey+eh//2) for (ex,ey,ew,eh) in raw_eyes[:2]]
            avg_x   = sum(c[0] for c in centers) / 2
            avg_y   = sum(c[1] for c in centers) / 2
            gaze_x  = (avg_x - fw/2) / (fw/2)
            gaze_y  = (avg_y - fh/2) / (fh/2)
            gaze_offset = (gaze_x, gaze_y)

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

    frame = draw_overlay(frame, faces, eyes_list, gaze_offset, attention_ok)

    _, buf        = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 78])
    annotated_b64 = base64.b64encode(buf).decode('utf-8')

    return jsonify({
        'face_detected':  face_detected,
        'attention_ok':   attention_ok,
        'gaze_x':         round(gaze_x, 3),
        'events':         events,
        'annotated_image': annotated_b64,
    })


@app.route('/speed', methods=['POST'])
def check_speed():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data'}), 400

    lat       = data.get('lat')
    lon       = data.get('lon')
    speed_mph = data.get('speed_mph', 0)

    if lat is None or lon is None:
        return jsonify({'error': 'No coordinates'}), 400

    speed_limit = get_speed_limit(lat, lon)
    over_limit  = speed_mph > speed_limit
    overage     = max(0, speed_mph - speed_limit)

    deduction = 0
    if overage > 5:
        if overage <= 10:  deduction = 3
        elif overage <= 20: deduction = 8
        else:               deduction = 20

    return jsonify({
        'speed_mph':   round(speed_mph, 1),
        'speed_limit': speed_limit,
        'over_limit':  over_limit,
        'overage':     round(overage, 1),
        'deduction':   deduction,
    })


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print('DriveSafe CV server starting...')
    app.run(host='0.0.0.0', port=port, debug=False)
