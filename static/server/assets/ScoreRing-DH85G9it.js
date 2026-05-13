import { V as jsxRuntimeExports } from "./server-C0XKCpSm.js";
function colorFor(_score) {
  return "var(--color-foreground)";
}
function ScoreRing({ score, size = 200, stroke = 14, label, sublabel }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score));
  const offset = c - pct / 100 * c;
  const color = colorFor();
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative inline-flex items-center justify-center", style: { width: size, height: size }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: size, height: size, className: "-rotate-90", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: size / 2, cy: size / 2, r, stroke: "var(--color-muted)", strokeWidth: stroke, fill: "none" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "circle",
        {
          cx: size / 2,
          cy: size / 2,
          r,
          stroke: color,
          strokeWidth: stroke,
          strokeLinecap: "round",
          fill: "none",
          strokeDasharray: c,
          strokeDashoffset: offset,
          style: { transition: "stroke-dashoffset 600ms ease, stroke 300ms" }
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute inset-0 flex flex-col items-center justify-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-5xl font-bold tracking-tight", style: { color }, children: Math.round(pct) }),
      label && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs uppercase tracking-widest text-muted-foreground mt-1", children: label }),
      sublabel && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground mt-0.5", children: sublabel })
    ] })
  ] });
}
export {
  ScoreRing as S
};
