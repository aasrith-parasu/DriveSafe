import { O as useRouter, V as jsxRuntimeExports } from "./server-C0XKCpSm.js";
import { L as Link } from "./router-DXFopunx.js";
import { c as createLucideIcon } from "./createLucideIcon-BX7DVrEv.js";
function useLocation(opts) {
  const router = useRouter();
  {
    const location = router.stores.location.get();
    return location;
  }
}
const __iconNode$3 = [
  ["path", { d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8", key: "1357e3" }],
  ["path", { d: "M3 3v5h5", key: "1xhq8a" }],
  ["path", { d: "M12 7v5l4 2", key: "1fdv2h" }]
];
const History = createLucideIcon("history", __iconNode$3);
const __iconNode$2 = [
  ["path", { d: "M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8", key: "5wwlr5" }],
  [
    "path",
    {
      d: "M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
      key: "r6nss1"
    }
  ]
];
const House = createLucideIcon("house", __iconNode$2);
const __iconNode$1 = [
  ["path", { d: "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2", key: "975kel" }],
  ["circle", { cx: "12", cy: "7", r: "4", key: "17ys0d" }]
];
const User = createLucideIcon("user", __iconNode$1);
const __iconNode = [
  [
    "path",
    {
      d: "m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5",
      key: "ftymec"
    }
  ],
  ["rect", { x: "2", y: "6", width: "14", height: "12", rx: "2", key: "158x01" }]
];
const Video = createLucideIcon("video", __iconNode);
const items = [
  { to: "/", label: "Home", icon: House },
  { to: "/live", label: "Live", icon: Video },
  { to: "/history", label: "History", icon: History },
  { to: "/profile", label: "Profile", icon: User }
];
function BottomNav() {
  const { pathname } = useLocation();
  return /* @__PURE__ */ jsxRuntimeExports.jsx("nav", { className: "fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-40", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-3 mb-3 rounded-md glass/90 backdrop-blur-xl shadow-soft", children: /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "grid grid-cols-4", children: items.map(({ to, label, icon: Icon }) => {
    const active = pathname === to;
    return /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Link,
      {
        to,
        className: `flex flex-col items-center gap-1 py-3 text-xs transition-colors ${active ? "text-primary" : "text-muted-foreground hover:text-foreground"}`,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-5 w-5", strokeWidth: active ? 2.5 : 1.75 }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: label })
        ]
      }
    ) }, to);
  }) }) }) });
}
const trips = [
  {
    id: "t-008",
    date: "Today · 8:42 AM",
    duration: "32 min",
    score: 92,
    distance: "14.2 mi",
    topViolation: "Hard brake",
    deductions: [
      { label: "Speed violations", pts: 3 },
      { label: "Hard braking", pts: 4 },
      { label: "No face detected", pts: 1 }
    ]
  },
  {
    id: "t-007",
    date: "Yesterday · 6:10 PM",
    duration: "48 min",
    score: 78,
    distance: "22.8 mi",
    topViolation: "Speeding",
    deductions: [
      { label: "Speed violations", pts: 12 },
      { label: "Hard braking", pts: 6 },
      { label: "No face detected", pts: 4 }
    ]
  },
  {
    id: "t-006",
    date: "May 9 · 7:55 AM",
    duration: "28 min",
    score: 88,
    distance: "11.6 mi",
    topViolation: "Hard brake",
    deductions: [
      { label: "Speed violations", pts: 4 },
      { label: "Hard braking", pts: 6 },
      { label: "No face detected", pts: 2 }
    ]
  },
  {
    id: "t-005",
    date: "May 8 · 5:30 PM",
    duration: "1h 04m",
    score: 65,
    distance: "41.3 mi",
    topViolation: "Phone use",
    deductions: [
      { label: "Speed violations", pts: 14 },
      { label: "Hard braking", pts: 9 },
      { label: "No face detected", pts: 12 }
    ]
  },
  {
    id: "t-004",
    date: "May 7 · 9:12 AM",
    duration: "22 min",
    score: 95,
    distance: "8.9 mi",
    topViolation: "—",
    deductions: [
      { label: "Speed violations", pts: 2 },
      { label: "Hard braking", pts: 2 },
      { label: "No face detected", pts: 1 }
    ]
  }
];
function scoreColorClass(s) {
  if (s >= 85) return "bg-foreground text-background border-foreground";
  if (s >= 70) return "bg-surface-elevated text-foreground border-border";
  if (s >= 55) return "bg-background text-foreground border-foreground/40";
  return "bg-background text-muted-foreground border-border";
}
function tierFor(score) {
  if (score >= 90) return { tier: "Excellent", premium: "$78 – $95 / mo", color: "success" };
  if (score >= 80) return { tier: "Good", premium: "$96 – $128 / mo", color: "primary" };
  if (score >= 65) return { tier: "Fair", premium: "$130 – $175 / mo", color: "warning" };
  return { tier: "High Risk", premium: "$180 – $260 / mo", color: "destructive" };
}
export {
  BottomNav as B,
  tierFor as a,
  scoreColorClass as s,
  trips as t
};
