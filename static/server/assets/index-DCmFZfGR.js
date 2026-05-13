import { V as jsxRuntimeExports } from "./server-C0XKCpSm.js";
import { L as Link } from "./router-DXFopunx.js";
import { S as ScoreRing } from "./ScoreRing-DH85G9it.js";
import { t as trips, s as scoreColorClass, B as BottomNav } from "./trips-5PB_2iX_.js";
import { c as createLucideIcon } from "./createLucideIcon-BX7DVrEv.js";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
const __iconNode$2 = [["path", { d: "m9 18 6-6-6-6", key: "mthhwq" }]];
const ChevronRight = createLucideIcon("chevron-right", __iconNode$2);
const __iconNode$1 = [
  [
    "path",
    {
      d: "M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z",
      key: "10ikf1"
    }
  ]
];
const Play = createLucideIcon("play", __iconNode$1);
const __iconNode = [
  [
    "path",
    {
      d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",
      key: "oel41y"
    }
  ]
];
const Shield = createLucideIcon("shield", __iconNode);
function Home() {
  const avg = Math.round(trips.reduce((s, t) => s + t.score, 0) / trips.length);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto min-h-screen w-full max-w-md px-5 pb-28 pt-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-9 w-9 items-center justify-center rounded bg-primary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Shield, { className: "h-5 w-5 text-primary-foreground" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-lg font-bold tracking-tight", children: "DriveSafe" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] text-muted-foreground -mt-0.5", children: "Good morning, Alex" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/profile", className: "h-9 w-9 rounded-full bg-surface-elevated grid place-items-center text-sm font-semibold", children: "A" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mt-8 rounded-lg glass p-6 shadow-soft", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-col items-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ScoreRing, { score: avg, label: "30-day score", sublabel: `${trips.length} trips` }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 grid grid-cols-3 gap-3 text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "Trips", value: String(trips.length) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "Miles", value: "98.8" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "Tier", value: "Good" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/live", className: "mt-6 flex w-full items-center justify-center gap-3 rounded-md bg-primary py-5 text-lg font-semibold text-primary-foreground active:scale-[0.98] transition", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Play, { className: "h-5 w-5 fill-current" }),
      "Start Trip"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mt-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-semibold uppercase tracking-wider text-muted-foreground", children: "Recent trips" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/history", className: "text-xs text-primary", children: "See all" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "space-y-2", children: trips.slice(0, 3).map((t) => /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/history", className: "flex items-center gap-3 rounded-md glass p-3 active:scale-[0.99] transition", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `grid h-12 w-12 place-items-center rounded border text-sm font-bold ${scoreColorClass(t.score)}`, children: t.score }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium truncate", children: t.date }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
            t.duration,
            " · ",
            t.distance
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "h-4 w-4 text-muted-foreground" })
      ] }) }, t.id)) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(BottomNav, {})
  ] });
}
function Stat({
  label,
  value
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded bg-surface py-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-lg font-semibold", children: value }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] uppercase tracking-wider text-muted-foreground", children: label })
  ] });
}
export {
  Home as component
};
