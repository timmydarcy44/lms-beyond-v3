"use client";

const OUTER = [
  { angle: 0, size: 26 },
  { angle: 60, size: 26 },
  { angle: 120, size: 26 },
  { angle: 180, size: 26 },
  { angle: 240, size: 26 },
  { angle: 300, size: 26 },
] as const;

const INNER = [
  { angle: 30, size: 18 },
  { angle: 150, size: 18 },
  { angle: 270, size: 18 },
] as const;

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + Math.cos(rad) * r, y: cy + Math.sin(rad) * r };
}

/**
 * Sphère centrale + satellites en orbite, reliés entre eux et à la sphère.
 */
export function EdgeDiagnosticsOrbit() {
  const cx = 160;
  const cy = 160;
  const rOuter = 112;
  const rInner = 72;

  const outerPts = OUTER.map((s) => ({ ...s, ...polar(cx, cy, rOuter, s.angle) }));
  const innerPts = INNER.map((s) => ({ ...s, ...polar(cx, cy, rInner, s.angle) }));

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[360px]">
      <svg viewBox="0 0 320 320" className="h-full w-full overflow-visible" aria-hidden>
        <defs>
          <radialGradient id="edge-orbit-core" cx="38%" cy="32%" r="68%">
            <stop offset="0%" stopColor="#525252" />
            <stop offset="45%" stopColor="#262626" />
            <stop offset="100%" stopColor="#0a0a0a" />
          </radialGradient>
          <filter id="edge-orbit-soft" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="0.6" />
          </filter>
        </defs>

        <circle
          cx={cx}
          cy={cy}
          r={rInner}
          fill="none"
          stroke="rgba(10,10,10,0.08)"
          strokeWidth="1"
          strokeDasharray="2 8"
        />
        <circle cx={cx} cy={cy} r={rOuter} fill="none" stroke="rgba(10,10,10,0.1)" strokeWidth="1" />

        <g
          className="animate-[edge-orbit-spin_36s_linear_infinite]"
          style={{ transformOrigin: "160px 160px" }}
        >
          {outerPts.map((p, i) => {
            const next = outerPts[(i + 1) % outerPts.length]!;
            return (
              <g key={`o-${i}`}>
                <line
                  x1={cx}
                  y1={cy}
                  x2={p.x}
                  y2={p.y}
                  stroke="rgba(10,10,10,0.16)"
                  strokeWidth="1"
                />
                <line
                  x1={p.x}
                  y1={p.y}
                  x2={next.x}
                  y2={next.y}
                  stroke="rgba(10,10,10,0.1)"
                  strokeWidth="1"
                />
              </g>
            );
          })}
          {innerPts.map((p, i) => (
            <line
              key={`spoke-i-${i}`}
              x1={cx}
              y1={cy}
              x2={p.x}
              y2={p.y}
              stroke="rgba(10,10,10,0.14)"
              strokeWidth="1"
            />
          ))}
          {/* Cross-links inner ↔ nearest outer */}
          {innerPts.map((p, i) => {
            const target = outerPts[i * 2] ?? outerPts[0]!;
            return (
              <line
                key={`cross-${i}`}
                x1={p.x}
                y1={p.y}
                x2={target.x}
                y2={target.y}
                stroke="rgba(10,10,10,0.1)"
                strokeWidth="1"
              />
            );
          })}

          {outerPts.map((p, i) => (
            <g key={`sat-o-${i}`}>
              <circle
                cx={p.x}
                cy={p.y}
                r={p.size / 2}
                fill="#f5f5f5"
                stroke="rgba(10,10,10,0.12)"
                strokeWidth="1"
              />
              <circle cx={p.x - 3} cy={p.y - 3} r={3.5} fill="rgba(255,255,255,0.95)" />
            </g>
          ))}
          {innerPts.map((p, i) => (
            <g key={`sat-i-${i}`}>
              <circle
                cx={p.x}
                cy={p.y}
                r={p.size / 2}
                fill="#e5e5e5"
                stroke="rgba(10,10,10,0.12)"
                strokeWidth="1"
              />
              <circle cx={p.x - 2} cy={p.y - 2} r={2.5} fill="rgba(255,255,255,0.9)" />
            </g>
          ))}
        </g>

        <circle cx={cx} cy={cy} r="38" fill="url(#edge-orbit-core)" />
        <circle
          cx={cx - 10}
          cy={cy - 12}
          r="14"
          fill="rgba(255,255,255,0.16)"
          className="animate-[edge-orbit-pulse_4.5s_ease-in-out_infinite]"
        />
        <circle cx={cx} cy={cy} r="38" fill="none" stroke="rgba(10,10,10,0.22)" strokeWidth="1" />
      </svg>
    </div>
  );
}
