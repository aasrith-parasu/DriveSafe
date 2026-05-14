import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { Accelerometer } from 'expo-sensors';
import { push, ref } from 'firebase/database';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, Vibration, View } from 'react-native';
import { db } from '../../firebase';

const SERVER_URL      = 'http://192.168.1.148:5000/analyze';
const SPEED_URL       = 'http://192.168.1.148:5000/speed';
const FRAME_MS        = 800;

// Accelerometer: phone at rest reads ~1G due to gravity.
// We accumulate readings over a 300ms window and compare peak vs baseline.
// Delta thresholds are tuned for real driving events.
const BRAKE_DELTA     = 0.45;  // sudden change > 0.45G = hard brake
const TURN_DELTA      = 0.30;  // sudden change > 0.30G = sharp turn
const ACCEL_WINDOW_MS = 300;   // window to detect peak G-force change

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const [locationPermission, setLocationPermission] = useState(false);
  const [cvData, setCvData]             = useState<any>(null);
  const [speedData, setSpeedData]       = useState<any>(null);
  const [annotatedImage, setAnnotatedImage] = useState<string | null>(null);
  const [score, setScore]               = useState(100);
  const [alerts, setAlerts]             = useState<string[]>([]);
  const [seconds, setSeconds]           = useState(0);
  const [tripEnded, setTripEnded]       = useState(false);

  const cameraRef      = useRef<any>(null);
  const sending        = useRef(false);
  const deductions     = useRef<Set<string>>(new Set());
  const secondsRef     = useRef(0);          // always-current seconds for callbacks
  const scoreRef       = useRef(100);        // always-current score for saveTrip
  // Accelerometer: rolling window for peak detection
  const accelWindow    = useRef<number[]>([]); // recent magnitudes
  const accelBaseline  = useRef(1.0);          // smoothed baseline (~1G at rest)
  const lastAccelEvent = useRef(0);            // timestamp of last event (ms)

  // Keep refs in sync
  useEffect(() => { secondsRef.current = seconds; }, [seconds]);
  useEffect(() => { scoreRef.current = score; }, [score]);

  const addAlert = useCallback((msg: string) => {
    setAlerts((a) => {
      const next = [...a.slice(-1), msg];
      return next;
    });
    Vibration.vibrate(200);
    setTimeout(() => setAlerts((a) => a.filter((x) => x !== msg)), 3000);
  }, []);

  const applyDeduction = useCallback((key: string, pts: number) => {
    if (deductions.current.has(key)) return;
    deductions.current.add(key);
    setScore((s) => {
      const next = Math.max(0, s - pts);
      scoreRef.current = next;
      return next;
    });
  }, []);

  // ── Timer ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // ── Location permission ───────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
    })();
  }, []);

  // ── Camera frame streaming ────────────────────────────────────────────────
  useEffect(() => {
    if (!permission?.granted) return;
    // Wait 2s for camera to warm up, then start interval
    const warmup = setTimeout(() => {
      const interval = setInterval(async () => {
        if (!cameraRef.current || sending.current) return;
        sending.current = true;
        try {
          const photo = await cameraRef.current.takePictureAsync({
            base64: true,
            quality: 0.3,
            skipProcessing: true,
            shutterSound: false,
          });
          if (!photo?.base64) return;
          const res  = await fetch(SERVER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: photo.base64 }),
          });
          const data = await res.json();
          setCvData(data);
          if (data.annotated_image) {
            setAnnotatedImage(`data:image/jpeg;base64,${data.annotated_image}`);
          }
          if (!data.face_detected) {
            const bucket = Math.floor(secondsRef.current / 10);
            applyDeduction(`no_face_${bucket}`, 5);
            addAlert('⚠️ Face not detected');
          } else if (data.drowsy) {
            const bucket = Math.floor(secondsRef.current / 5);
            applyDeduction(`drowsy_${bucket}`, 8);
            addAlert('😴 Drowsiness detected');
          } else if (data.attention_ok === false) {
            const bucket = Math.floor(secondsRef.current / 5);
            applyDeduction(`distracted_${bucket}`, 3);
            addAlert('👀 Eyes off road');
          }
        } catch (e) {
          console.log('CV server error:', e);
        } finally {
          sending.current = false;
        }
      }, FRAME_MS);
      return () => clearInterval(interval);
    }, 2000);
    return () => clearTimeout(warmup);
  }, [permission?.granted]); // no seconds dep — uses secondsRef instead

  // ── GPS speed vs speed limit ──────────────────────────────────────────────
  useEffect(() => {
    if (!locationPermission) return;
    let subscription: Location.LocationSubscription | null = null;

    Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 5 },
      async (loc) => {
        const { latitude, longitude, speed } = loc.coords;
        // speed from GPS is in m/s; can be null or negative when stationary
        const speed_mph = speed != null && speed > 0 ? speed * 2.23694 : 0;
        try {
          const res  = await fetch(SPEED_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat: latitude, lon: longitude, speed_mph }),
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          setSpeedData(data);
          if (data.over_limit && data.overage > 5) {
            const bucket = Math.floor(secondsRef.current / 15);
            applyDeduction(`speed_${bucket}`, data.deduction);
            addAlert(`🚨 Speeding ${Math.round(data.speed_mph)}/${data.speed_limit} mph`);
          }
        } catch (e) {
          console.log('Speed lookup error:', e);
        }
      }
    ).then((sub) => { subscription = sub; });

    return () => { subscription?.remove(); };
  }, [locationPermission]);

  // ── Accelerometer: window-based G-force detection ────────────────────────
  // Reads at 50ms intervals, keeps a 300ms rolling window.
  // Compares peak in window vs smoothed baseline to detect real events.
  useEffect(() => {
    Accelerometer.setUpdateInterval(50);
    const sub = Accelerometer.addListener(({ x, y, z }) => {
      const magnitude = Math.sqrt(x * x + y * y + z * z);
      const now = Date.now();

      // Update rolling window (keep last ~300ms = 6 samples at 50ms)
      accelWindow.current.push(magnitude);
      if (accelWindow.current.length > 6) accelWindow.current.shift();

      // Slowly update baseline toward current magnitude (low-pass filter)
      accelBaseline.current = accelBaseline.current * 0.95 + magnitude * 0.05;

      // Only check if we have a full window and enough time since last event
      if (accelWindow.current.length < 6) return;
      if (now - lastAccelEvent.current < 1500) return; // 1.5s cooldown between events

      const peak  = Math.max(...accelWindow.current);
      const delta = peak - accelBaseline.current;
      const bucket = Math.floor(secondsRef.current / 3);

      if (delta > BRAKE_DELTA) {
        lastAccelEvent.current = now;
        applyDeduction(`brake_${bucket}`, 5);
        addAlert('🛑 Hard brake / impact detected');
      } else if (delta > TURN_DELTA) {
        lastAccelEvent.current = now;
        applyDeduction(`turn_${bucket}`, 3);
        addAlert('↩️ Sharp turn detected');
      }
    });
    return () => sub.remove();
  }, []); // runs once — uses secondsRef for bucketing

  // ── End Trip ──────────────────────────────────────────────────────────────
  async function handleEndTrip() {
    const finalScore = scoreRef.current;
    const finalSecs  = secondsRef.current;

    // Save to Firebase
    try {
      await push(ref(db, 'trips'), {
        score:           finalScore,
        seconds:         finalSecs,
        speedViolations: [...deductions.current].filter((k) => k.startsWith('speed')).length,
        brakeEvents:     [...deductions.current].filter((k) => k.startsWith('brake')).length,
        turnEvents:      [...deductions.current].filter((k) => k.startsWith('turn')).length,
        faceEvents:      [...deductions.current].filter((k) => k.startsWith('no_face')).length,
        timestamp:       Date.now(),
      });
    } catch (e) {
      console.log('Firebase save error (non-fatal):', e);
    }

    setTripEnded(true);

    const mm = String(Math.floor(finalSecs / 60)).padStart(2, '0');
    const ss = String(finalSecs % 60).padStart(2, '0');
    const tier =
      finalScore >= 90 ? 'Excellent 🟢' :
      finalScore >= 75 ? 'Good 🟡' :
      finalScore >= 60 ? 'Fair 🟠' : 'High Risk 🔴';

    Alert.alert(
      '🏁 Trip Complete',
      `Score: ${finalScore}/100\nTier: ${tier}\nDuration: ${mm}:${ss}\n\nBrake events: ${[...deductions.current].filter(k => k.startsWith('brake')).length}\nTurn events: ${[...deductions.current].filter(k => k.startsWith('turn')).length}\nFace alerts: ${[...deductions.current].filter(k => k.startsWith('no_face')).length}\nSpeed alerts: ${[...deductions.current].filter(k => k.startsWith('speed')).length}`,
      [{ text: 'OK' }]
    );
  }

  // ── Derived display values ────────────────────────────────────────────────
  const mm           = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss           = String(seconds % 60).padStart(2, '0');
  const displaySpeed = speedData ? Math.round(speedData.speed_mph) : 0;
  const speedLimit   = speedData ? speedData.speed_limit : '...';
  const overLimit    = speedData?.over_limit ?? false;
  const faceDetected = cvData?.face_detected ?? false;
  const attentionOk  = cvData?.attention_ok ?? true;

  if (!permission?.granted) {
    return (
      <View style={s.center}>
        <Text style={s.white} onPress={requestPermission}>Tap to grant camera access</Text>
      </View>
    );
  }

  return (
    <View style={s.container}>
      {/* Live camera feed */}
      <CameraView style={StyleSheet.absoluteFill} facing="front" ref={cameraRef} />

      {/* Annotated CV feed overlaid on top */}
      {annotatedImage && (
        <Image source={{ uri: annotatedImage }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      )}

      {/* Top bar */}
      <View style={s.topBar}>
        <View style={s.recRow}>
          <View style={s.recDot} />
          <Text style={s.recText}>REC</Text>
          <Text style={s.timer}>{mm}:{ss}</Text>
        </View>
        <View style={s.pillRow}>
          <Pill label={`Face ${faceDetected ? '✓' : '✗'}`} ok={faceDetected} />
          <Pill label={`Attn ${attentionOk ? '✓' : '✗'}`} ok={attentionOk} />
          <Pill label={`Speed ${!overLimit ? '✓' : '✗'}`} ok={!overLimit} />
        </View>
      </View>

      {/* Alerts */}
      <View style={s.alertBox} pointerEvents="none">
        {alerts.map((a, i) => (
          <View key={i} style={s.alert}>
            <Text style={s.alertText}>{a}</Text>
          </View>
        ))}
      </View>

      {/* Bottom card */}
      <View style={s.bottomCard}>
        <View style={s.bottomRow}>
          <View>
            <Text style={s.label}>SPEED</Text>
            <Text style={[s.bigNum, overLimit && s.red]}>
              {displaySpeed} <Text style={s.sub}>/ {speedLimit} mph</Text>
            </Text>
          </View>
          <View style={s.right}>
            <Text style={s.label}>LIVE SCORE</Text>
            <Text style={s.bigNum}>{score}</Text>
          </View>
        </View>
        <View style={s.bar}>
          <View style={[s.barFill, { width: `${score}%` as any }]} />
        </View>
        <TouchableOpacity
          style={[s.endBtn, tripEnded && s.endBtnDisabled]}
          onPress={handleEndTrip}
          disabled={tripEnded}
        >
          <Text style={s.endBtnText}>{tripEnded ? '✓ Trip Saved' : '⏹ End Trip'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Pill({ label, ok }: { label: string; ok?: boolean }) {
  return (
    <View style={[s.pill, ok ? s.pillOk : s.pillBad]}>
      <Text style={[s.pillText, ok ? s.pillTextOk : s.pillTextBad]}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#000' },
  center:         { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  white:          { color: '#fff', fontSize: 16 },
  topBar:         { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20, paddingTop: 54, paddingHorizontal: 16 },
  recRow:         { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 8, padding: 10, marginBottom: 8 },
  recDot:         { width: 10, height: 10, borderRadius: 5, backgroundColor: '#ef4444', marginRight: 6 },
  recText:        { color: '#fff', fontSize: 12, fontWeight: '600', marginRight: 10 },
  timer:          { color: '#fff', fontSize: 16, fontFamily: 'monospace' },
  pillRow:        { flexDirection: 'row', gap: 8 },
  pill:           { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99, borderWidth: 1 },
  pillOk:         { backgroundColor: 'rgba(0,255,80,0.15)', borderColor: 'rgba(0,255,80,0.4)' },
  pillBad:        { backgroundColor: 'rgba(239,68,68,0.15)', borderColor: 'rgba(239,68,68,0.4)' },
  pillText:       { fontSize: 11, fontWeight: '500' },
  pillTextOk:     { color: '#00ff50' },
  pillTextBad:    { color: '#ef4444' },
  alertBox:       { position: 'absolute', top: 160, left: 0, right: 0, zIndex: 30, alignItems: 'center', gap: 8 },
  alert:          { backgroundColor: 'rgba(239,68,68,0.9)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  alertText:      { color: '#fff', fontSize: 13, fontWeight: '600' },
  bottomCard:     { position: 'absolute', bottom: 30, left: 16, right: 16, zIndex: 20, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  bottomRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  label:          { color: 'rgba(255,255,255,0.5)', fontSize: 10, letterSpacing: 2, marginBottom: 2 },
  bigNum:         { color: '#fff', fontSize: 32, fontWeight: '700' },
  sub:            { fontSize: 14, fontWeight: '400', color: 'rgba(255,255,255,0.4)' },
  red:            { color: '#ef4444' },
  right:          { alignItems: 'flex-end' },
  bar:            { marginTop: 12, height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 99, overflow: 'hidden' },
  barFill:        { height: '100%', backgroundColor: '#fff', borderRadius: 99 },
  endBtn:         { marginTop: 12, backgroundColor: '#ef4444', borderRadius: 8, padding: 10, alignItems: 'center' },
  endBtnDisabled: { backgroundColor: '#444' },
  endBtnText:     { color: '#fff', fontSize: 14, fontWeight: '600' },
});
