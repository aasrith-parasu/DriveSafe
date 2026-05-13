import { V as jsxRuntimeExports } from "./server-C0XKCpSm.js";
import { t as trips, B as BottomNav, a as tierFor } from "./trips-5PB_2iX_.js";
import { S as ScoreRing } from "./ScoreRing-DH85G9it.js";
import { c as createLucideIcon } from "./createLucideIcon-BX7DVrEv.js";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
import "./router-DXFopunx.js";
const __iconNode$2 = [
  [
    "path",
    {
      d: "m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526",
      key: "1yiouv"
    }
  ],
  ["circle", { cx: "12", cy: "8", r: "6", key: "1vp47v" }]
];
const Award = createLucideIcon("award", __iconNode$2);
const __iconNode$1 = [
  [
    "path",
    {
      d: "M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915",
      key: "1i5ecw"
    }
  ],
  ["circle", { cx: "12", cy: "12", r: "3", key: "1v7zrd" }]
];
const Settings = createLucideIcon("settings", __iconNode$1);
const __iconNode = [
  ["path", { d: "M16 7h6v6", key: "box55l" }],
  ["path", { d: "m22 7-8.5 8.5-5-5L2 17", key: "1t1m79" }]
];
const TrendingUp = createLucideIcon("trending-up", __iconNode);
function Profile() {
  const avg = Math.round(trips.reduce((s, t2) => s + t2.score, 0) / trips.length);
  const t = tierFor(avg);
  const trend = [72, 78, 75, 82, 80, 85, 83, 88, 86, 90, 87, 92, 88, 91, avg];
  const max = 100, min = 50;
  const w = 320, h = 110;
  const path = trend.map((v, i) => {
    const x = i / (trend.length - 1) * w;
    const y = h - (v - min) / (max - min) * h;
    return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" ");
  const tierColor = {
    success: "bg-success/15 text-success border-success/30",
    primary: "bg-primary/15 text-primary border-primary/30",
    warning: "bg-warning/15 text-warning border-warning/30",
    destructive: "bg-destructive/15 text-destructive border-destructive/30"
  }[t.color];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto min-h-screen w-full max-w-md px-5 pb-28 pt-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid h-12 w-12 place-items-center rounded-md bg-primary text-lg font-bold text-primary-foreground", children: "A" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-lg font-bold", children: "Alex Morgan" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Member since May 2024" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "grid h-9 w-9 place-items-center rounded bg-surface-elevated", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Settings, { className: "h-4 w-4" }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mt-6 flex items-center gap-5 rounded-lg glass p-5 shadow-soft", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(ScoreRing, { score: avg, size: 130, stroke: 10, label: "30-day avg" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] uppercase tracking-widest text-muted-foreground", children: "Insurance tier" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: `mt-1 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-bold ${tierColor}`, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Award, { className: "h-3.5 w-3.5" }),
          " ",
          t.tier
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-[10px] uppercase tracking-widest text-muted-foreground", children: "Estimated premium" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-base font-bold", children: t.premium })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mt-5 rounded-lg glass p-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-semibold uppercase tracking-wider text-muted-foreground", children: "Score trend" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1 text-xs text-success", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { className: "h-3 w-3" }),
          "+8 pts"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { viewBox: `0 0 ${w} ${h}`, className: "mt-4 w-full", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("defs", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("linearGradient", { id: "trend", x1: "0", x2: "0", y1: "0", y2: "1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("stop", { offset: "0%", stopColor: "oklch(0.18 0 0 / 0.5)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("stop", { offset: "100%", stopColor: "oklch(0.18 0 0 / 0)" })
        ] }) }),
        [0, 0.25, 0.5, 0.75, 1].map((p) => /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "0", x2: w, y1: p * h, y2: p * h, stroke: "oklch(1 0 0 / 0.05)" }, p)),
        /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: `${path} L ${w} ${h} L 0 ${h} Z`, fill: "url(#trend)" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: path, stroke: "oklch(0.18 0 0)", strokeWidth: "2.5", fill: "none", strokeLinecap: "round", strokeLinejoin: "round" }),
        trend.map((v, i) => {
          const x = i / (trend.length - 1) * w;
          const y = h - (v - min) / (max - min) * h;
          return /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: x, cy: y, r: i === trend.length - 1 ? 4 : 0, fill: "oklch(0.18 0 0)" }, i);
        })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex justify-between text-[10px] text-muted-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "30d ago" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Today" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mt-5 grid grid-cols-3 gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { value: "14", label: "Trips" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { value: "98.8", label: "Miles" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { value: "2", label: "Alerts" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(BottomNav, {})
  ] });
}
function Stat({
  value,
  label
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-md glass p-4 text-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl font-bold", children: value }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] uppercase tracking-wider text-muted-foreground", children: label })
  ] });
}
export {
  Profile as component
};
