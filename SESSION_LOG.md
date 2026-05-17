# DriveSafe — Session Log
_Date: May 15, 2026_

---

## Summary

This session fixed all major blocking issues with the DriveSafe Expo app and Python CV server, and upgraded the face/attention detection system for the hackathon demo.

---

## Issues Fixed

### 1. Firebase Module Resolution (App wouldn't start)

**Problem:** Metro bundler couldn't resolve `firebase/app` — it was picking up the browser/ESM build instead of the React Native build.

**Root cause:** `metro.config.js` had `unstable_enablePackageExports = true`, which told Metro to use the `exports` field in Firebase's `package.json`. That field points to the browser build.

**Fix:** Set `unstable_enablePackageExports = false` in `metro.config.js`.

**Also fixed:** `index.tsx` was calling `push(ref(db, 'trips'), ...)` but never imported `push` or `ref` from `firebase/database`.

---

### 2. Expo QR Code / Wrong IP Address

**Problem:** Expo was advertising `192.168.1.148` (a stale/wrong IP from a disconnected adapter) instead of the correct `192.168.1.96`.

**Fix:** Start Expo with the IP explicitly set:
```
set REACT_NATIVE_PACKAGER_HOSTNAME=192.168.1.96 & npx expo start --clear
```

Also set `lanAddress` in `.expo/settings.json` to lock it.

**Note:** Tunnel mode (`--tunnel`) was attempted but failed due to ngrok timeout. Direct LAN with explicit IP works fine.

---

### 3. Face Detection Not Working

**Problem:** OpenCV Haar cascades (`haarcascade_frontalface_default.xml`) were too strict for a dashboard-mounted phone — failing on angled faces, varying lighting, and small face sizes.

**Fix:** Replaced with **dlib's HOG-based frontal face detector** + **68-point facial landmark predictor** (`shape_predictor_68_face_landmarks.dat`).

The landmark model was downloaded to `C:\Users\JK\DriveSafe\shape_predictor_68_face_landmarks.dat` (~99MB).

**New CV overlay features:**
- Full face mesh: jaw outline, eyebrows, nose bridge, nose base, lips, eye contours
- Eye Aspect Ratio (EAR) for drowsiness detection
- Gaze direction arrow from nose tip
- "ATTENTIVE / DISTRACTED / DROWSY" status label on feed
- EAR readout in corner
- Haar cascades kept as fallback if dlib not installed

---

### 4. Attention / Gaze Detection Not Working

**Problem:** Previous gaze detection used eye center average relative to face center — unreliable and not actually checking road attention.

**Fix:** Proper gaze using 68-point landmarks:
- Gaze X calculated from eye positions relative to nose bridge and jaw width
- `GAZE_X_THRESH = 0.35` — looking >35% off-center = distracted
- `GAZE_AWAY_THRESH = 4` frames before flagging (avoids false positives from brief glances)
- Counter decays when driver looks back
- `EAR_THRESH = 0.22` — eyes closing = drowsy
- `DROWSY_THRESH = 5` consecutive frames before drowsy alert

**App alerts added:**
- `😴 Drowsiness detected` — 8 point deduction
- `👀 Eyes off road` — 3 point deduction

---

### 5. Accelerometer G-Force Detection Not Working

**Problem:** Code checked absolute accelerometer magnitude. Phone at rest reads ~1.0G (gravity), so `BRAKE_THRESHOLD = 1.8` almost never fired. Also, the `seconds` state was in the dependency array, causing the listener to be re-created every second.

**Fix:** Switched to **delta-based detection** — comparing each reading to the previous one:
- `BRAKE_DELTA = 0.6` — sudden change >0.6G = hard brake (5pt deduction)
- `TURN_DELTA = 0.5` — sudden change >0.5G = sharp turn (3pt deduction)
- Removed `seconds` from dependency array, use `secondsRef` instead

---

### 6. End Trip Button Not Working

**Problem:** `saveTrip()` used stale `score` and `seconds` state values (captured at mount time). No user feedback after tapping.

**Fix:** 
- Added `scoreRef` and `secondsRef` that stay in sync with state
- `handleEndTrip()` uses refs for accurate final values
- Shows native `Alert` popup with full trip summary: score, tier, duration, brake/turn/face/speed event counts
- Button changes to "✓ Trip Saved" and disables after tapping

---

### 7. Speed Limit Detection Not Working

**Problem:** Two bugs in the OSM Overpass API call:
1. Used `requests.post()` with raw body — Overpass prefers `requests.get()` with `params=`
2. Search radius was 30m — too small for many roads
3. No fallback when `maxspeed` tag is missing (common on residential roads)
4. `seconds` in GPS effect dependency array caused a new subscription every second (subscription leak)

**Fix:**
- Switched to `requests.get()` with `params={'data': query}`
- Widened search radius to 50m
- Added second query that infers speed from road type when no `maxspeed` tag exists:
  - `motorway=65`, `trunk=55`, `primary=45`, `secondary=35`, `tertiary=30`, `residential=25`, `living_street=15`
- Added coordinate-based cache to avoid hammering OSM on every GPS update
- Fixed GPS subscription leak — removed `seconds` from dependency array, use `secondsRef`

---

## Current State

| Feature | Status |
|---|---|
| App launches in Expo Go | ✅ Fixed |
| Firebase saves trips | ✅ Fixed |
| Face detection (dlib) | ✅ Fixed |
| 68-point landmark overlay | ✅ Working |
| Gaze/attention detection | ✅ Fixed |
| Drowsiness detection (EAR) | ✅ New |
| Hard brake detection | ✅ Fixed |
| Sharp turn detection | ✅ Fixed |
| End Trip button + summary | ✅ Fixed |
| Speed limit (OSM) | ✅ Fixed |
| Speed limit cache | ✅ New |

---

## Files Changed This Session

| File | Changes |
|---|---|
| `metro.config.js` | `unstable_enablePackageExports = false` |
| `.expo/settings.json` | Added `lanAddress: 192.168.1.96` |
| `app/(tabs)/index.tsx` | Full rewrite — fixed all 4 app-side issues |
| `server.py` | Full rewrite — dlib landmarks, fixed OSM, fixed gaze |
| `shape_predictor_68_face_landmarks.dat` | Downloaded (~99MB) |

---

## How to Run

**Terminal 1 — Python server:**
```
cd C:\Users\JK\DriveSafe
python server.py
```
Expected output:
```
[CV] dlib + landmarks loaded ✓
  dlib available:      True
  landmarks available: True
DriveSafe CV server starting...
 * Running on http://0.0.0.0:5000
```

**Terminal 2 — Expo app:**
```
cd C:\Users\JK\DriveSafe
set REACT_NATIVE_PACKAGER_HOSTNAME=192.168.1.96 & npx expo start --clear
```

Scan QR code with Expo Go on phone (must be on same WiFi as laptop).

---

## Known Issues / Next Steps

1. **dlib install** — if `pip install dlib` fails on Windows, try `pip install dlib --no-build-isolation` or install via conda
2. **IP may change** — always run `ipconfig` and check `Ethernet` adapter. Update `SERVER_URL` / `SPEED_URL` in `index.tsx` if needed
3. **Trip Summary Screen** — still TODO: `app/(tabs)/summary.tsx` with score breakdown
4. **Home Screen** — still TODO: `app/(tabs)/home.tsx` with trip history
5. **Speed detection** — only meaningful when actually driving on a mapped road; defaults to 25mph otherwise

---

## Key Config

| Item | Value |
|---|---|
| Laptop IP | `192.168.1.96` |
| Python server | `http://192.168.1.96:5000` |
| Firebase project | `drivesafe-496020` |
| Firebase DB URL | `https://drivesafe-496020-default-rtdb.firebaseio.com` |
| Expo port | `8081` |
