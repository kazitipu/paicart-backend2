import React from "react";

/* Hand-rolled SVG chart primitives.
 *
 * chart.js v2 is installed, but its defaults (grey gridlines, its own font
 * metrics, canvas-rasterised text) fight the panel's look, and every attempt
 * to bend them ends up as a wall of option objects like the ones in
 * constants/chartData.js. These are a few hundred lines of viewBox maths
 * instead, drawn with the same tokens as listUi.jsx, and they inherit the
 * page font for free.
 *
 * Everything here is responsive by construction: the SVG carries a viewBox
 * and width="100%", so the parent grid decides the size.
 */

const AXIS = "#e9eef5";
const MUTED = "#94a3b8";

/* ------------------------------------------------------------------ paths */

/* Catmull-Rom through the points, converted to cubic beziers. A polyline
   reads as noise at sparkline size; a spline reads as a trend. */
const smoothPath = (points) => {
  if (points.length === 0) return "";
  if (points.length < 3) {
    return points
      .map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`)
      .join(" ");
  }
  let d = `M${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    /* Plain Catmull-Rom overshoots hard around a spike - a single busy day in
       a quiet month sent the curve clean out of the top of the card. Clamping
       each control point to its own segment's y-range keeps the curve inside
       the data it is drawn from. */
    const lo = Math.min(p1.y, p2.y);
    const hi = Math.max(p1.y, p2.y);
    const clamp = (y) => Math.min(hi, Math.max(lo, y));
    const c1y = clamp(p1.y + (p2.y - p0.y) / 6);
    const c2y = clamp(p2.y - (p3.y - p1.y) / 6);
    d += ` C${c1x},${c1y} ${c2x},${c2y} ${p2.x},${p2.y}`;
  }
  return d;
};

/* Each chart needs its own gradient id or the second one on the page reuses
   the first one's colour. */
let gradientSeq = 0;
const nextGradientId = () => `pcg${(gradientSeq += 1)}`;

/* ------------------------------------------------------------- AreaSpark */

/* Trend line for a KPI tile. No axes, no labels - the number above it is the
   value, this only carries the shape. */
export class AreaSpark extends React.PureComponent {
  constructor(props) {
    super(props);
    this.gradientId = nextGradientId();
  }

  render() {
    const { values = [], color = "#FF6A00", height = 38 } = this.props;
    if (values.length < 2) return <div style={{ height }} />;

    const W = 120;
    const H = height;
    const pad = 3;
    const max = Math.max(...values);
    const min = Math.min(...values);
    const span = max - min || 1;
    const step = (W - pad * 2) / (values.length - 1);

    const points = values.map((value, i) => ({
      x: pad + i * step,
      y: pad + (H - pad * 2) * (1 - (value - min) / span),
    }));
    const line = smoothPath(points);
    const last = points[points.length - 1];

    return (
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height={H}
        preserveAspectRatio="none"
        aria-hidden="true"
        style={{ display: "block", overflow: "visible" }}
      >
        <defs>
          <linearGradient id={this.gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d={`${line} L${last.x},${H} L${points[0].x},${H} Z`}
          fill={`url(#${this.gradientId})`}
        />
        <path
          d={line}
          fill="none"
          stroke={color}
          strokeWidth="1.6"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        <circle cx={last.x} cy={last.y} r="2.4" fill={color} />
      </svg>
    );
  }
}

/* -------------------------------------------------------------- ComboBars */

/* Bars for the count, a spline over them for the money. Two scales, because
   an order count and a taka total never share a sensible axis.
   `buckets` = [{ label, shortLabel, count, value }] */
export class ComboBars extends React.Component {
  constructor(props) {
    super(props);
    this.gradientId = nextGradientId();
    this.state = { hover: null };
  }

  render() {
    const {
      buckets = [],
      height = 240,
      barColor = "#FF6A00",
      lineColor = "#2563eb",
      formatValue = (v) => v,
      showLine = true,
    } = this.props;

    /* A window with no activity still has a full set of buckets, so an
       empty check on length alone would draw an axis and a row of zero-height
       stubs that reads as a broken chart rather than a quiet day. */
    const hasData = buckets.some((b) => b.count > 0 || (b.value || 0) > 0);
    if (buckets.length === 0 || !hasData) {
      return (
        <div
          style={{
            height,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            color: MUTED,
          }}
        >
          {this.props.emptyLabel || "Nothing recorded in this window"}
        </div>
      );
    }

    const W = 720;
    const H = height;
    const padL = 6;
    const padR = 6;
    const padT = 14;
    const padB = 26;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;

    const maxCount = Math.max(1, ...buckets.map((b) => b.count));
    const maxValue = Math.max(1, ...buckets.map((b) => b.value || 0));

    const slot = plotW / buckets.length;
    /* Bars stay legible from 7 buckets to 31: a fixed width would either
       leave gaps or overlap, so it is a fraction of the slot, capped. */
    const barW = Math.max(3, Math.min(26, slot * 0.52));

    /* The value line gets 8% headroom so a peak month sits just under the top
       rule instead of riding on it, where the stroke reads as clipped. */
    const lineTop = padT + plotH * 0.08;
    const lineH = plotH * 0.92;
    const linePoints = buckets.map((b, i) => ({
      x: padL + slot * i + slot / 2,
      y: lineTop + lineH * (1 - (b.value || 0) / maxValue),
    }));
    const line = smoothPath(linePoints);

    /* Four horizontal rules is enough to read a level against without the
       grid becoming the loudest thing in the card. */
    const rules = [0, 0.25, 0.5, 0.75, 1].map((t) => padT + plotH * t);

    /* With a month of bars, every label collides; print every nth. */
    const labelStride = Math.ceil(buckets.length / 12);
    const { hover } = this.state;

    return (
      <div style={{ position: "relative" }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          height={H}
          preserveAspectRatio="none"
          style={{ display: "block", overflow: "visible" }}
        >
          <defs>
            <linearGradient id={this.gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={barColor} stopOpacity="1" />
              <stop offset="100%" stopColor={barColor} stopOpacity="0.55" />
            </linearGradient>
          </defs>

          {rules.map((y, i) => (
            <line
              key={i}
              x1={padL}
              x2={W - padR}
              y1={y}
              y2={y}
              stroke={AXIS}
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          ))}

          {buckets.map((b, i) => {
            const h = (b.count / maxCount) * plotH;
            const x = padL + slot * i + (slot - barW) / 2;
            const y = padT + plotH - h;
            const active = hover === i;
            return (
              <g key={i}>
                <rect
                  x={x}
                  y={b.count > 0 ? y : padT + plotH - 2}
                  width={barW}
                  height={b.count > 0 ? h : 2}
                  rx={Math.min(4, barW / 2)}
                  fill={`url(#${this.gradientId})`}
                  opacity={hover === null || active ? 1 : 0.42}
                />
                {/* Full-slot transparent target: the bars themselves are too
                    thin to hover reliably at 31 buckets. */}
                <rect
                  x={padL + slot * i}
                  y={padT}
                  width={slot}
                  height={plotH}
                  fill="transparent"
                  onMouseEnter={() => this.setState({ hover: i })}
                  onMouseLeave={() => this.setState({ hover: null })}
                />
              </g>
            );
          })}

          {showLine && (
            <path
              d={line}
              fill="none"
              stroke={lineColor}
              strokeWidth="2"
              strokeLinecap="round"
              strokeOpacity="0.85"
              vectorEffect="non-scaling-stroke"
              pointerEvents="none"
            />
          )}

          {hover !== null && (
            <line
              x1={linePoints[hover].x}
              x2={linePoints[hover].x}
              y1={padT}
              y2={padT + plotH}
              stroke={MUTED}
              strokeWidth="1"
              strokeDasharray="3 3"
              vectorEffect="non-scaling-stroke"
              pointerEvents="none"
            />
          )}
        </svg>

        {/* Labels live in HTML, not the SVG: preserveAspectRatio="none"
            stretches the viewBox horizontally and would smear the glyphs. */}
        <div style={{ display: "flex", marginTop: 6 }}>
          {buckets.map((b, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                textAlign: "center",
                fontSize: 10,
                color: hover === i ? "#0f172a" : MUTED,
                fontWeight: hover === i ? 700 : 500,
                whiteSpace: "nowrap",
                overflow: "hidden",
              }}
            >
              {i % labelStride === 0 || hover === i ? b.shortLabel : ""}
            </div>
          ))}
        </div>

        {hover !== null && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: `${((hover + 0.5) / buckets.length) * 100}%`,
              transform: "translateX(-50%)",
              background: "rgb(0, 37, 76)",
              color: "#fff",
              borderRadius: 9,
              padding: "7px 11px",
              fontSize: 11,
              lineHeight: 1.5,
              whiteSpace: "nowrap",
              pointerEvents: "none",
              boxShadow: "0 8px 20px rgba(15,23,42,.22)",
              zIndex: 3,
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 2 }}>
              {buckets[hover].label}
            </div>
            <div style={{ opacity: 0.85 }}>
              {buckets[hover].count}{" "}
              {buckets[hover].count === 1 ? "order" : "orders"}
            </div>
            {showLine && (
              <div style={{ opacity: 0.85 }}>
                {formatValue(buckets[hover].value || 0)}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
}

/* ------------------------------------------------------------------ Donut */

/* `slices` = [{ label, value, color }] */
export const Donut = ({
  slices = [],
  size = 190,
  thickness = 22,
  centerLabel = "",
  centerValue = "",
}) => {
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  const r = (size - thickness) / 2;
  const c = size / 2;
  const circumference = 2 * Math.PI * r;

  let offset = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={c}
        cy={c}
        r={r}
        fill="none"
        stroke="#f1f5f9"
        strokeWidth={thickness}
      />
      {total > 0 &&
        slices.map((slice, i) => {
          if (slice.value <= 0) return null;
          const fraction = slice.value / total;
          const dash = circumference * fraction;
          const el = (
            <circle
              key={i}
              cx={c}
              cy={c}
              r={r}
              fill="none"
              stroke={slice.color}
              strokeWidth={thickness}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
              /* -90deg so the first slice starts at twelve o'clock. */
              transform={`rotate(-90 ${c} ${c})`}
              strokeLinecap="butt"
            >
              <title>{`${slice.label}: ${slice.value}`}</title>
            </circle>
          );
          offset += dash;
          return el;
        })}
      <text
        x={c}
        y={c - 2}
        textAnchor="middle"
        style={{ fontSize: 26, fontWeight: 800, fill: "#0f172a" }}
      >
        {centerValue}
      </text>
      <text
        x={c}
        y={c + 16}
        textAnchor="middle"
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.07em",
          fill: MUTED,
        }}
      >
        {String(centerLabel).toUpperCase()}
      </text>
    </svg>
  );
};

/* ------------------------------------------------------------------ Meter */

export const Meter = ({ value, max, color = "#FF6A00", height = 6 }) => (
  <div
    style={{
      background: "#f1f5f9",
      borderRadius: 999,
      height,
      overflow: "hidden",
      width: "100%",
    }}
  >
    <div
      className="pc-meter-fill"
      style={{
        width: `${max > 0 ? Math.max(value > 0 ? 3 : 0, (value / max) * 100) : 0}%`,
        height: "100%",
        borderRadius: 999,
        background: color,
      }}
    />
  </div>
);

/* ------------------------------------------------------------- ChartFrame */

export const ChartFrame = ({ title, subtitle, right, children, bodyStyle }) => (
  <div
    className="card"
    style={{
      border: "1px solid #e9eef5",
      borderRadius: 14,
      boxShadow: "0 1px 2px rgba(15,23,42,.04)",
      overflow: "hidden",
      height: "calc(100% - 30px)",
    }}
  >
    <div
      className="card-header"
      style={{
        padding: "20px 24px 16px",
        border: "none",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 12,
        flexWrap: "wrap",
      }}
    >
      <div>
        <h5
          style={{
            margin: 0,
            fontWeight: 700,
            color: "#0f172a",
            fontSize: 16,
            textTransform: "none",
          }}
        >
          {title}
        </h5>
        {subtitle && (
          <p style={{ margin: "3px 0 0", fontSize: 12, color: MUTED }}>
            {subtitle}
          </p>
        )}
      </div>
      {right}
    </div>
    <div
      className="card-body"
      style={{
        padding: "4px 24px 24px",
        borderTop: "1px solid #eef2f7",
        paddingTop: 20,
        ...bodyStyle,
      }}
    >
      {children}
    </div>
  </div>
);
