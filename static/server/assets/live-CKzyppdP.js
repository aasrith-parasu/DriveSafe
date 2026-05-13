import { r as reactExports, V as jsxRuntimeExports } from "./server-C0XKCpSm.js";
import { u as useNavigate } from "./router-DXFopunx.js";
import { c as createLucideIcon } from "./createLucideIcon-BX7DVrEv.js";
import { T as TriangleAlert } from "./triangle-alert-BXJv292w.js";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
const __iconNode = [
  ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2", key: "afitv7" }]
];
const Square = createLucideIcon("square", __iconNode);
const SERVER = "https://dish-running-mothball.ngrok-free.dev";
const FRAME_INTERVAL = 800;
const BRAKE_THRESHOLD = 15;
const TURN_THRESHOLD = 12;
function Live() {
  const navigate = useNavigate();
  const videoRef = reactExports.useRef(null);
  const canvasRef = reactExports.useRef(null);
  const streamRef = reactExports.useRef(null);
  const intervalRef = reactExports.useRef(null);
  const [seconds, setSeconds] = reactExports.useState(0);
  const [score, setScore] = reactExports.useState(100);
  const [alerts, setAlerts] = reactExports.useState([]);
  const [annotatedFrame, setAnnotatedFrame] = reactExports.useState(null);
  const [cvData, setCvData] = reactExports.useState(null);
  const [speedData, setSpeedData] = reactExports.useState(null);
  const [connected, setConnected] = reactExports.useState(false);
  const [deductions, setDeductions] = reactExports.useState({});
  const addAlert = reactExports.useCallback((msg) => {
    setAlerts((a) => [...a.slice(-2), msg]);
    setTimeout(() => setAlerts((a) => a.filter((x) => x !== msg)), 3e3);
  }, []);
  const applyDeduction = reactExports.useCallback((key, pts) => {
    setDeductions((d) => {
      if (d[key]) return d;
      setScore((s) => Math.max(0, s - pts));
      return {
        ...d,
        [key]: pts
      };
    });
  }, []);
  reactExports.useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1e3);
    return () => clearInterval(t);
  }, []);
  reactExports.useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: 480,
            height: 640
          }
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setConnected(true);
      } catch (e) {
        console.error("Camera error:", e);
      }
    }
    startCamera();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);
  reactExports.useEffect(() => {
    if (!connected) return;
    intervalRef.current = setInterval(async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2) return;
      canvas.width = 320;
      canvas.height = 240;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, 320, 240);
      const base64 = canvas.toDataURL("image/jpeg", 0.4).split(",")[1];
      try {
        const res = await fetch(`${SERVER}/analyze`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            image: base64
          })
        });
        const data = await res.json();
        setCvData(data);
        if (data.annotated_image) {
          setAnnotatedFrame(`data:image/jpeg;base64,${data.annotated_image}`);
        }
        if (!data.face_detected) {
          applyDeduction("no_face_" + Math.floor(seconds / 10), 5);
          addAlert("⚠️ Face not detected — keep eyes on road");
        }
      } catch (e) {
        console.log("Server unreachable");
      }
    }, FRAME_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [connected, seconds]);
  reactExports.useEffect(() => {
    if (!navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(async (pos) => {
      const {
        latitude,
        longitude,
        speed
      } = pos.coords;
      const speed_mph = speed ? speed * 2.23694 : 0;
      try {
        const res = await fetch(`${SERVER}/speed`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            lat: latitude,
            lon: longitude,
            speed_mph
          })
        });
        const data = await res.json();
        setSpeedData(data);
        if (data.over_limit && data.overage > 5) {
          applyDeduction("speed_" + Math.floor(seconds / 15), data.deduction);
          addAlert(`⚠️ Speeding — ${Math.round(data.speed_mph)} in ${data.speed_limit} mph zone`);
        }
      } catch (e) {
      }
    }, null, {
      enableHighAccuracy: true,
      maximumAge: 1e3
    });
    return () => navigator.geolocation.clearWatch(id);
  }, [seconds]);
  reactExports.useEffect(() => {
    function handleMotion(e) {
      const acc = e.accelerationIncludingGravity;
      if (!acc) return;
      const x = acc.x ?? 0;
      const y = acc.y ?? 0;
      const magnitude = Math.sqrt(x * x + y * y);
      if (magnitude > BRAKE_THRESHOLD) {
        applyDeduction("brake_" + Date.now(), 5);
        addAlert("⚠️ Hard brake detected");
      } else if (magnitude > TURN_THRESHOLD) {
        applyDeduction("turn_" + Date.now(), 3);
        addAlert("⚠️ Sharp turn detected");
      }
    }
    window.addEventListener("devicemotion", handleMotion);
    return () => window.removeEventListener("devicemotion", handleMotion);
  }, []);
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  const displaySpeed = speedData ? Math.round(speedData.speed_mph) : 0;
  const speedLimit = speedData ? speedData.speed_limit : 35;
  const overLimit = speedData?.over_limit ?? false;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative mx-auto h-screen w-full max-w-md overflow-hidden bg-black", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("video", { ref: videoRef, className: "hidden", playsInline: true, muted: true }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("canvas", { ref: canvasRef, className: "hidden" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute inset-0", children: [
      annotatedFrame ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: annotatedFrame, className: "h-full w-full object-cover", alt: "CV feed" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("video", { ref: videoRef, className: "h-full w-full object-cover", playsInline: true, muted: true }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pointer-events-none absolute inset-0 bg-[linear-gradient(transparent_0%,oklch(1_0_0/0.03)_50%,transparent_100%)] bg-[length:100%_4px]" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute top-0 left-0 right-0 z-20 px-4 pt-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between rounded-md border border-white/10 bg-black/40 p-3 backdrop-blur-md", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "relative flex h-2.5 w-2.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "relative inline-flex h-2.5 w-2.5 rounded-full bg-destructive" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-semibold text-white/90", children: "REC" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ml-2 font-mono text-base text-white", children: [
            mm,
            ":",
            ss
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => {
          streamRef.current?.getTracks().forEach((t) => t.stop());
          navigate({
            to: "/summary",
            search: {
              score,
              sec: seconds
            }
          });
        }, className: "flex items-center gap-1.5 rounded bg-destructive px-3 py-1.5 text-xs font-semibold text-destructive-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Square, { className: "h-3 w-3 fill-current" }),
          " End Trip"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 flex flex-wrap gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Pill, { ok: cvData?.face_detected, children: [
          "Face ",
          cvData?.face_detected ? "✓" : "✗"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Pill, { ok: !overLimit, children: [
          "Speed ",
          !overLimit ? "✓" : "✗"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Pill, { ok: connected, children: [
          "CV ",
          connected ? "active" : "offline"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute left-1/2 top-32 z-30 -translate-x-1/2 flex flex-col gap-2", children: alerts.map((a, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 rounded border border-destructive/50 bg-destructive/90 px-4 py-2 text-sm font-semibold text-destructive-foreground animate-in fade-in slide-in-from-top-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "h-4 w-4" }),
      " ",
      a
    ] }, i)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute bottom-6 left-4 right-4 z-20 rounded-md border border-white/10 bg-black/55 p-4 backdrop-blur-xl", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] uppercase tracking-widest text-white/60", children: "Speed" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: `text-3xl font-bold ${overLimit ? "text-destructive" : "text-white"}`, children: [
            displaySpeed,
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-base font-medium text-white/50", children: [
              "/ ",
              speedLimit,
              " mph"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] uppercase tracking-widest text-white/60", children: "Live score" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-3xl font-bold text-white", children: score })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full bg-white transition-all", style: {
        width: `${score}%`
      } }) })
    ] })
  ] });
}
function Pill({
  children,
  ok
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium backdrop-blur-md ${ok ? "border-success/40 bg-success/15 text-success" : "border-destructive/40 bg-destructive/15 text-destructive"}`, children });
}
export {
  Live as component
};
