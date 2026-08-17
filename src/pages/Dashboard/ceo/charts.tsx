import { useEffect, useId, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { fmtBDT, fmtBDTShort, fmtCompact, fmtNum } from "./data";
import type {
  CategorySlice,
  ComparisonPoint,
  HeatmapData,
  RevenueMetric,
  SalesPoint,
  SizeDatum,
} from "./types";

/* ------------------------------------------------------------------ */
/* helpers                                                              */
/* ------------------------------------------------------------------ */

function niceMax(v: number): number {
  const exp = Math.floor(Math.log10(v));
  const step = Math.pow(10, exp);
  const norm = v / step;
  const mult =
    norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 3 ? 3 : norm <= 4 ? 4 : norm <= 5 ? 5 : 10;
  return mult * step;
}

/** Catmull-Rom → cubic bezier smoothing */
function smoothPath(pts: readonly (readonly [number, number])[]): string {
  if (pts.length < 2) return "";
  let d = `M ${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}

/** Track container width via ResizeObserver */
function useMeasuredWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      setWidth(entries[0]?.contentRect.width ?? 0);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, width };
}

/* ------------------------------------------------------------------ */
/* Sparkline                                                            */
/* ------------------------------------------------------------------ */

export function Sparkline({
  data,
  color,
  width = 96,
  height = 34,
}: {
  data: number[];
  color: string;
  width?: number;
  height?: number;
}) {
  const gid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - 3 - ((v - min) / range) * (height - 6);
    return [x, y] as const;
  });
  const line = pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1];

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="shrink-0 overflow-visible"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${height} ${line} ${width},${height}`} fill={`url(#${gid})`} />
      <polyline
        points={line}
        fill="none"
        stroke={color}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last[0]} cy={last[1]} r={2.25} fill={color} />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Interactive area trend chart                                         */
/* ------------------------------------------------------------------ */

export function TrendChart({
  data,
  metric,
  height = 264,
  color,
  id,
}: {
  data: SalesPoint[];
  metric: RevenueMetric;
  height?: number;
  color: string;
  id: string;
}) {
  const { ref: wrapRef, width } = useMeasuredWidth();
  const [hover, setHover] = useState<number | null>(null);
  const gid = useId().replace(/[^a-zA-Z0-9]/g, "");

  const pad = { top: 14, right: 16, bottom: 28, left: 46 };
  const innerW = Math.max(0, width - pad.left - pad.right);
  const innerH = height - pad.top - pad.bottom;

  const values = data.map((d) => (metric === "revenue" ? d.revenue : d.units));
  const maxV = niceMax(Math.max(...values, 1));
  const avg = values.reduce((s, v) => s + v, 0) / values.length;

  const x = (i: number) => pad.left + (data.length <= 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
  const y = (v: number) => pad.top + innerH - (v / maxV) * innerH;

  const pts = data.map((_, i) => [x(i), y(values[i])] as const);
  const linePath = smoothPath(pts);
  const areaPath = `${linePath} L ${x(data.length - 1).toFixed(1)},${(pad.top + innerH).toFixed(1)} L ${x(0).toFixed(1)},${(pad.top + innerH).toFixed(1)} Z`;

  const ticks = 4;
  const labelEvery = Math.max(1, Math.ceil(data.length / 6));

  const handleMove = (e: ReactMouseEvent<SVGRectElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = e.clientX - rect.left;
    const idx = Math.round(((relX - pad.left) / innerW) * (data.length - 1));
    setHover(Math.min(data.length - 1, Math.max(0, idx)));
  };

  const hovered = hover !== null ? data[hover] : null;
  const hoverValue = hover !== null ? values[hover] : 0;
  const tooltipLeft = hover !== null ? Math.min(Math.max(x(hover), 74), width - 74) : 0;
  const tooltipTop = hover !== null ? y(hoverValue) : 0;

  const axisLabel = (v: number) => (metric === "revenue" ? fmtBDTShort(v) : fmtCompact(v));
  const tipValue = (v: number) => (metric === "revenue" ? fmtBDT(v) : `${fmtNum(v)} units`);

  return (
    <div
      ref={wrapRef}
      className="relative w-full select-none"
      style={{ height, animation: "fade-up 0.45s ease both" }}
    >
      {width > 0 && (
        <svg width={width} height={height} className="block" role="img" aria-label="Sales trend chart">
          <defs>
            <linearGradient id={`${id}-${gid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.22" />
              <stop offset="100%" stopColor={color} stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* horizontal grid + y labels */}
          {Array.from({ length: ticks + 1 }, (_, i) => {
            const gy = pad.top + (innerH / ticks) * i;
            const gv = maxV - (maxV / ticks) * i;
            return (
              <g key={i}>
                <line
                  x1={pad.left}
                  x2={pad.left + innerW}
                  y1={gy}
                  y2={gy}
                  stroke="#E8EDF4"
                  strokeWidth={1}
                />
                <text x={pad.left - 8} y={gy + 3.5} textAnchor="end" fontSize={10.5} fill="#94A3B8">
                  {axisLabel(gv)}
                </text>
              </g>
            );
          })}

          {/* average reference line */}
          {innerW > 120 && (
            <g>
              <line
                x1={pad.left}
                x2={pad.left + innerW}
                y1={y(avg)}
                y2={y(avg)}
                stroke="#94A3B8"
                strokeWidth={1}
                strokeDasharray="4 4"
                strokeOpacity={0.45}
              />
              <text
                x={pad.left + innerW - 4}
                y={y(avg) - 5}
                textAnchor="end"
                fontSize={10}
                fill="#94A3B8"
              >
                avg
              </text>
            </g>
          )}

          {/* area + line */}
          <path d={areaPath} fill={`url(#${id}-${gid})`} />
          <path
            d={linePath}
            fill="none"
            stroke={color}
            strokeWidth={2.25}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* x labels */}
          {data.map((d, i) =>
            i % labelEvery === 0 ? (
              <text
                key={d.label}
                x={x(i)}
                y={height - 8}
                textAnchor="middle"
                fontSize={10.5}
                fill="#94A3B8"
              >
                {d.label}
              </text>
            ) : null,
          )}

          {/* hover interaction */}
          <rect
            x={pad.left}
            y={pad.top}
            width={innerW}
            height={innerH}
            fill="transparent"
            onMouseMove={handleMove}
            onMouseLeave={() => setHover(null)}
          />
          {hovered && (
            <g pointerEvents="none">
              <line
                x1={x(hover ?? 0)}
                x2={x(hover ?? 0)}
                y1={pad.top}
                y2={pad.top + innerH}
                stroke={color}
                strokeOpacity={0.3}
                strokeDasharray="3 3"
              />
              <circle
                cx={x(hover ?? 0)}
                cy={y(hoverValue)}
                r={4.5}
                fill="#FFFFFF"
                stroke={color}
                strokeWidth={2.5}
              />
            </g>
          )}
        </svg>
      )}

      {/* tooltip */}
      {hovered && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-md border border-line bg-navy px-2.5 py-1.5 shadow-md"
          style={{ left: tooltipLeft, top: tooltipTop - 58 }}
        >
          <p className="text-[10px] font-medium uppercase tracking-wider text-white/55">
            {hovered.label}
          </p>
          <p className="mt-0.5 text-[13px] font-bold tabular-nums text-white">{tipValue(hoverValue)}</p>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Grouped bar chart (current vs previous period)                       */
/* ------------------------------------------------------------------ */

export function GroupedBarChart({
  data,
  height = 236,
  colorA = "#3AAFA9",
  colorB = "#CBD5E1",
}: {
  data: ComparisonPoint[];
  height?: number;
  colorA?: string;
  colorB?: string;
}) {
  const { ref: wrapRef, width } = useMeasuredWidth();
  const [hover, setHover] = useState<number | null>(null);

  const pad = { top: 14, right: 12, bottom: 26, left: 46 };
  const innerW = Math.max(0, width - pad.left - pad.right);
  const innerH = height - pad.top - pad.bottom;
  const maxV = niceMax(Math.max(...data.flatMap((d) => [d.current, d.previous]), 1));

  const groupW = innerW / data.length;
  const barW = Math.min(20, groupW * 0.26);
  const xC = (i: number) => pad.left + groupW * i + groupW / 2;
  const y = (v: number) => pad.top + innerH - (v / maxV) * innerH;

  const ticks = 4;
  const hovered = hover !== null ? data[hover] : null;
  const tooltipLeft = hover !== null ? Math.min(Math.max(xC(hover), 90), width - 90) : 0;

  return (
    <div
      ref={wrapRef}
      className="relative w-full select-none"
      style={{ height, animation: "fade-up 0.45s ease both" }}
    >
      {width > 0 && (
        <svg width={width} height={height} className="block" role="img" aria-label="Monthly comparison chart">
          {Array.from({ length: ticks + 1 }, (_, i) => {
            const gy = pad.top + (innerH / ticks) * i;
            const gv = maxV - (maxV / ticks) * i;
            return (
              <g key={i}>
                <line x1={pad.left} x2={pad.left + innerW} y1={gy} y2={gy} stroke="#E8EDF4" strokeWidth={1} />
                <text x={pad.left - 8} y={gy + 3.5} textAnchor="end" fontSize={10.5} fill="#94A3B8">
                  {fmtBDTShort(gv)}
                </text>
              </g>
            );
          })}

          {data.map((d, i) => {
            const cx = xC(i);
            const hCur = y(d.current);
            const hPrev = y(d.previous);
            const barHCur = pad.top + innerH - hCur;
            const barHPrev = pad.top + innerH - hPrev;
            return (
              <g key={d.label} opacity={hover === null || hover === i ? 1 : 0.45} style={{ transition: "opacity 0.15s" }}>
                <rect
                  x={cx - barW - 1.5}
                  y={hCur}
                  width={barW}
                  height={Math.max(0, barHCur)}
                  rx={3}
                  fill={colorA}
                />
                <rect
                  x={cx + 1.5}
                  y={hPrev}
                  width={barW}
                  height={Math.max(0, barHPrev)}
                  rx={3}
                  fill={colorB}
                />
                <text x={cx} y={height - 8} textAnchor="middle" fontSize={10.5} fill="#94A3B8">
                  {d.label}
                </text>
                <rect
                  x={pad.left + groupW * i}
                  y={pad.top}
                  width={groupW}
                  height={innerH}
                  fill="transparent"
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                />
              </g>
            );
          })}
        </svg>
      )}

      {hovered && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-md border border-line bg-navy px-2.5 py-1.5 shadow-md"
          style={{ left: tooltipLeft, top: 2 }}
        >
          <p className="text-[10px] font-medium uppercase tracking-wider text-white/55">{hovered.label}</p>
          <p className="mt-1 flex items-center gap-1.5 text-[12px] text-white">
            <span className="h-2 w-2 rounded-[2px]" style={{ background: colorA }} />
            This year
            <b className="tabular-nums">{fmtBDTShort(hovered.current)}</b>
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-white/85">
            <span className="h-2 w-2 rounded-[2px]" style={{ background: colorB }} />
            Last year
            <b className="tabular-nums">{fmtBDTShort(hovered.previous)}</b>
          </p>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sales heatmap (day × hour)                                           */
/* ------------------------------------------------------------------ */

export function Heatmap({ data, height = 250 }: { data: HeatmapData; height?: number }) {
  const { ref: wrapRef, width } = useMeasuredWidth();
  const [hover, setHover] = useState<{ r: number; c: number } | null>(null);

  const pad = { top: 26, right: 8, bottom: 24, left: 42 };
  const gap = 3;
  const cols = data.hours.length;
  const rows = data.days.length;
  const innerW = Math.max(0, width - pad.left - pad.right);
  const innerH = height - pad.top - pad.bottom;
  const cellW = (innerW - (cols - 1) * gap) / cols;
  const cellH = (innerH - (rows - 1) * gap) / rows;
  const maxV = Math.max(...data.values.flat(), 1);
  const alpha = (v: number) => 0.07 + (v / maxV) * 0.88;

  const cellX = (c: number) => pad.left + c * (cellW + gap);
  const cellY = (r: number) => pad.top + r * (cellH + gap);

  const hovered =
    hover !== null ? { day: data.days[hover.r], hour: data.hours[hover.c], value: data.values[hover.r][hover.c] } : null;
  const tooltipLeft =
    hover !== null ? Math.min(Math.max(cellX(hover.c) + cellW / 2, 86), width - 86) : 0;

  return (
    <div
      ref={wrapRef}
      className="relative w-full select-none"
      style={{ animation: "fade-up 0.45s ease both" }}
    >
      {width > 0 && (
        <svg width={width} height={height} className="block" role="img" aria-label="Sales by day and hour heatmap">
          {data.hours.map((h, c) =>
            c % 2 === 0 ? (
              <text
                key={h}
                x={cellX(c) + cellW / 2}
                y={pad.top - 8}
                textAnchor="middle"
                fontSize={10}
                fill="#94A3B8"
              >
                {h}
              </text>
            ) : null,
          )}

          {data.days.map((d, r) => (
            <text key={d} x={pad.left - 7} y={cellY(r) + cellH / 2 + 3.5} textAnchor="end" fontSize={10.5} fill="#94A3B8">
              {d}
            </text>
          ))}

          {data.values.map((row, r) =>
            row.map((v, c) => {
              const isHover = hover?.r === r && hover?.c === c;
              return (
                <rect
                  key={`${r}-${c}`}
                  x={cellX(c)}
                  y={cellY(r)}
                  width={cellW}
                  height={cellH}
                  rx={3}
                  fill={`rgba(45, 85, 151, ${alpha(v)})`}
                  stroke={isHover ? "#1E293B" : "none"}
                  strokeWidth={isHover ? 1.5 : 0}
                  onMouseEnter={() => setHover({ r, c })}
                  onMouseLeave={() => setHover(null)}
                  style={{ transition: "fill 0.12s" }}
                />
              );
            }),
          )}
        </svg>
      )}

      {/* legend */}
      <div className="mt-2 flex items-center justify-end gap-2 text-[10px] text-faint">
        Low
        <span
          className="h-1.5 w-24 rounded-full"
          style={{ background: "linear-gradient(to right, rgba(45,85,151,0.07), rgba(45,85,151,0.95))" }}
        />
        High
      </div>

      {hovered && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-md border border-line bg-navy px-2.5 py-1.5 shadow-md"
          style={{ left: tooltipLeft, top: Math.max(4, cellY(hover!.r) - 12) }}
        >
          <p className="text-[10px] font-medium uppercase tracking-wider text-white/55">
            {hovered.day} · {hovered.hour}
          </p>
          <p className="mt-0.5 text-[13px] font-bold tabular-nums text-white">{fmtBDT(hovered.value)}</p>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Radial gauge (target progress)                                       */
/* ------------------------------------------------------------------ */

export function RadialGauge({
  value,
  max,
  size = 148,
  thickness = 13,
  color = "#3AAFA9",
}: {
  value: number;
  max: number;
  size?: number;
  thickness?: number;
  color?: string;
}) {
  const gid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const r = (size - thickness) / 2 - 2;
  const C = 2 * Math.PI * r;
  const pct = Math.min(1, Math.max(0, value / max));

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor="#2D5597" />
        </linearGradient>
      </defs>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#EEF2F7"
        strokeWidth={thickness}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={`url(#${gid})`}
        strokeWidth={thickness}
        strokeLinecap="round"
        strokeDasharray={`${(pct * C).toFixed(2)} ${C.toFixed(2)}`}
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Simple vertical bars (size distribution)                             */
/* ------------------------------------------------------------------ */

export function SimpleBars({
  data,
  height = 168,
  color = "#50B4D8",
}: {
  data: SizeDatum[];
  height?: number;
  color?: string;
}) {
  const { ref: wrapRef, width } = useMeasuredWidth();
  const [hover, setHover] = useState<number | null>(null);
  const gid = useId().replace(/[^a-zA-Z0-9]/g, "");

  const pad = { top: 20, right: 6, bottom: 24, left: 6 };
  const innerW = Math.max(0, width - pad.left - pad.right);
  const innerH = height - pad.top - pad.bottom;
  const maxV = niceMax(Math.max(...data.map((d) => d.value), 1));

  const groupW = innerW / data.length;
  const barW = Math.min(34, groupW * 0.56);
  const xC = (i: number) => pad.left + groupW * i + groupW / 2;
  const y = (v: number) => pad.top + innerH - (v / maxV) * innerH;

  return (
    <div ref={wrapRef} className="relative w-full select-none" style={{ animation: "fade-up 0.45s ease both" }}>
      {width > 0 && (
        <svg width={width} height={height} className="block" role="img" aria-label="Size distribution bar chart">
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} />
              <stop offset="100%" stopColor="#BFE3EF" />
            </linearGradient>
          </defs>
          {data.map((d, i) => {
            const bh = pad.top + innerH - y(d.value);
            return (
              <g
                key={d.label}
                opacity={hover === null || hover === i ? 1 : 0.45}
                style={{ transition: "opacity 0.15s" }}
              >
                <rect
                  x={xC(i) - barW / 2}
                  y={y(d.value)}
                  width={barW}
                  height={Math.max(0, bh)}
                  rx={3}
                  fill={`url(#${gid})`}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                />
                <text x={xC(i)} y={y(d.value) - 5} textAnchor="middle" fontSize={10} fontWeight={600} fill="#64748B">
                  {fmtCompact(d.value)}
                </text>
                <text x={xC(i)} y={height - 6} textAnchor="middle" fontSize={10.5} fill="#94A3B8">
                  {d.label}
                </text>
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Donut chart                                                          */
/* ------------------------------------------------------------------ */

export function DonutChart({
  slices,
  size = 176,
  thickness = 20,
}: {
  slices: CategorySlice[];
  size?: number;
  thickness?: number;
}) {
  const r = (size - thickness) / 2 - 2;
  const C = 2 * Math.PI * r;
  const total = slices.reduce((s, x) => s + x.value, 0);
  let acc = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#EEF2F7"
        strokeWidth={thickness}
      />
      {slices.map((s) => {
        const frac = s.value / total;
        const dash = Math.max(0, frac * C - 3);
        const offset = -acc * C;
        acc += frac;
        return (
          <circle
            key={s.label}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={thickness}
            strokeDasharray={`${dash.toFixed(2)} ${(C - dash).toFixed(2)}`}
            strokeDashoffset={offset.toFixed(2)}
          />
        );
      })}
    </svg>
  );
}
