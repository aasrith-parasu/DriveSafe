import { r as reactExports, V as jsxRuntimeExports } from "./server-C0XKCpSm.js";
import { t as trips, s as scoreColorClass, B as BottomNav } from "./trips-5PB_2iX_.js";
import { c as createLucideIcon } from "./createLucideIcon-BX7DVrEv.js";
import { T as TriangleAlert } from "./triangle-alert-BXJv292w.js";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
import "./router-DXFopunx.js";
const __iconNode$2 = [["path", { d: "m6 9 6 6 6-6", key: "qrunsl" }]];
const ChevronDown = createLucideIcon("chevron-down", __iconNode$2);
const __iconNode$1 = [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["path", { d: "M12 6v6l4 2", key: "mmk7yg" }]
];
const Clock = createLucideIcon("clock", __iconNode$1);
const __iconNode = [
  ["circle", { cx: "6", cy: "19", r: "3", key: "1kj8tv" }],
  ["path", { d: "M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15", key: "1d8sl" }],
  ["circle", { cx: "18", cy: "5", r: "3", key: "gq8acd" }]
];
const Route = createLucideIcon("route", __iconNode);
function History() {
  const [open, setOpen] = reactExports.useState(trips[0].id);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto min-h-screen w-full max-w-md px-5 pb-28 pt-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "mb-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs uppercase tracking-widest text-muted-foreground", children: "Your drives" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold", children: "History" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "space-y-3", children: trips.map((t) => {
      const isOpen = open === t.id;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "overflow-hidden rounded-md glass", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setOpen(isOpen ? null : t.id), className: "flex w-full items-center gap-3 p-4 text-left active:bg-surface-elevated", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `grid h-12 w-12 place-items-center rounded border text-sm font-bold ${scoreColorClass(t.score)}`, children: t.score }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold truncate", children: t.date }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-0.5 flex items-center gap-3 text-[11px] text-muted-foreground", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "h-3 w-3" }),
                t.duration
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { className: "h-3 w-3" }),
                t.distance
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-end gap-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1 text-[10px] text-muted-foreground", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "h-3 w-3" }),
              t.topViolation
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: `h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}` })
          ] })
        ] }),
        isOpen && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t border-border bg-surface px-4 py-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-2 text-[10px] uppercase tracking-widest text-muted-foreground", children: "Deductions" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "space-y-1.5", children: t.deductions.map((d) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-center justify-between text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: d.label }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-semibold", children: [
              "−",
              d.pts,
              " pts"
            ] })
          ] }, d.label)) })
        ] })
      ] }, t.id);
    }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(BottomNav, {})
  ] });
}
export {
  History as component
};
