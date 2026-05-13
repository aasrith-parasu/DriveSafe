import { V as jsxRuntimeExports } from "./server-C0XKCpSm.js";
import { R as Route, L as Link } from "./router-DXFopunx.js";
import { S as ScoreRing } from "./ScoreRing-DH85G9it.js";
import { c as createLucideIcon } from "./createLucideIcon-BX7DVrEv.js";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
const __iconNode$1 = [
  [
    "path",
    {
      d: "M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0",
      key: "1r0f0z"
    }
  ],
  ["circle", { cx: "12", cy: "10", r: "3", key: "ilqhr7" }]
];
const MapPin = createLucideIcon("map-pin", __iconNode$1);
const __iconNode = [
  [
    "path",
    {
      d: "M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z",
      key: "1c8476"
    }
  ],
  ["path", { d: "M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7", key: "1ydtos" }],
  ["path", { d: "M7 3v4a1 1 0 0 0 1 1h7", key: "t51u73" }]
];
const Save = createLucideIcon("save", __iconNode);
function Summary() {
  const {
    score = 87,
    sec = 1284
  } = Route.useSearch();
  const lost = 100 - score;
  const speedPts = Math.round(lost * 0.5);
  const brakePts = Math.round(lost * 0.3);
  const facePts = lost - speedPts - brakePts;
  const mm = Math.floor(sec / 60);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto min-h-screen w-full max-w-md px-5 pb-10 pt-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs uppercase tracking-widest text-muted-foreground", children: "Trip complete" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold", children: "Nice drive 👏" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/", className: "text-xs text-muted-foreground", children: "Close" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "mt-6 flex flex-col items-center rounded-lg glass p-6 shadow-soft", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ScoreRing, { score, label: "Final score", sublabel: `${mm} min · 14.2 mi` }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mt-5 rounded-lg glass p-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground", children: "Deductions" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Deduction, { label: "Speed violations", pts: speedPts, color: "destructive" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Deduction, { label: "Hard braking", pts: brakePts, color: "warning" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Deduction, { label: "No face detected", pts: facePts, color: "accent" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mt-5 overflow-hidden rounded-lg glass", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-semibold uppercase tracking-wider text-muted-foreground", children: "Route" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1 text-xs text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "h-3 w-3" }),
          " 14.2 mi"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative h-48 bg-surface", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { className: "absolute inset-0 h-full w-full", viewBox: "0 0 400 200", preserveAspectRatio: "none", children: [
        [...Array(8)].map((_, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: i * 50, y1: "0", x2: i * 50, y2: "200", stroke: "oklch(0 0 0 / 0.06)" }, `v${i}`)),
        [...Array(5)].map((_, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "0", y1: i * 50, x2: "400", y2: i * 50, stroke: "oklch(0 0 0 / 0.06)" }, `h${i}`)),
        /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M30 170 C 90 170, 110 100, 180 100 S 280 40, 370 50", stroke: "oklch(0.18 0 0)", strokeWidth: "3", fill: "none", strokeLinecap: "round" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "30", cy: "170", r: "6", fill: "oklch(0.18 0 0)" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "370", cy: "50", r: "6", fill: "oklch(1 0 0)", stroke: "oklch(0.18 0 0)", strokeWidth: "2" })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/history", className: "mt-6 flex w-full items-center justify-center gap-2 rounded-md bg-primary py-4 font-semibold text-primary-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "h-4 w-4" }),
      " Save Trip"
    ] })
  ] });
}
function Deduction({
  label,
  pts,
  color
}) {
  const cls = {
    destructive: "bg-destructive/15 text-destructive",
    warning: "bg-warning/15 text-warning",
    accent: "bg-accent/20 text-accent-foreground"
  }[color];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-center justify-between", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `h-2 w-2 rounded-full ${color === "destructive" ? "bg-destructive" : color === "warning" ? "bg-warning" : "bg-accent"}` }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm", children: label })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: `rounded-full px-2.5 py-0.5 text-xs font-bold ${cls}`, children: [
      "−",
      pts,
      " pts"
    ] })
  ] });
}
export {
  Summary as component
};
