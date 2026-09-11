import type { ReactElement } from "react";

const WRAP = "h-full w-full";

function OxDnaArt() {
  const rungs = Array.from({ length: 10 });
  return (
    <svg viewBox="0 0 640 360" className={WRAP} preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="oxdna-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
      </defs>
      <rect width="640" height="360" fill="none" />
      {/* faint GPU grid backdrop */}
      {Array.from({ length: 8 }).map((_, r) =>
        Array.from({ length: 14 }).map((_, c) => (
          <rect
            key={`${r}-${c}`}
            x={20 + c * 44}
            y={20 + r * 40}
            width="30"
            height="24"
            rx="3"
            fill="none"
            stroke="var(--border)"
            strokeWidth="1"
          />
        ))
      )}
      {/* double helix */}
      {(() => {
        const pts: [number, number][] = [];
        const N = 60;
        for (let i = 0; i <= N; i++) {
          const t = (i / N) * Math.PI * 4;
          const x = 60 + (i / N) * 520;
          pts.push([x, 180 + Math.sin(t) * 90]);
        }
        const pts2: [number, number][] = [];
        for (let i = 0; i <= N; i++) {
          const t = (i / N) * Math.PI * 4;
          const x = 60 + (i / N) * 520;
          pts2.push([x, 180 + Math.sin(t + Math.PI) * 90]);
        }
        const toPath = (p: [number, number][]) => p.map((pt, i) => `${i === 0 ? "M" : "L"}${pt[0]},${pt[1]}`).join(" ");
        return (
          <>
            {rungs.map((_, i) => {
              const idx = Math.round((i / (rungs.length - 1)) * (pts.length - 1));
              return (
                <line
                  key={i}
                  x1={pts[idx][0]}
                  y1={pts[idx][1]}
                  x2={pts2[idx][0]}
                  y2={pts2[idx][1]}
                  stroke="var(--muted)"
                  strokeWidth="2"
                  opacity="0.5"
                />
              );
            })}
            <path d={toPath(pts)} fill="none" stroke="url(#oxdna-g)" strokeWidth="3.5" strokeLinecap="round" />
            <path d={toPath(pts2)} fill="none" stroke="url(#oxdna-g)" strokeWidth="3.5" strokeLinecap="round" opacity="0.6" />
          </>
        );
      })()}
    </svg>
  );
}

function OxViewArt() {
  return (
    <svg viewBox="0 0 640 360" className={WRAP} preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="oxview-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
      </defs>
      {/* browser chrome */}
      <rect x="60" y="40" width="520" height="280" rx="10" fill="none" stroke="var(--border)" strokeWidth="2" />
      <rect x="60" y="40" width="520" height="34" rx="10" fill="var(--card)" stroke="var(--border)" strokeWidth="2" />
      <circle cx="80" cy="57" r="5" fill="var(--muted)" opacity="0.5" />
      <circle cx="98" cy="57" r="5" fill="var(--muted)" opacity="0.5" />
      <circle cx="116" cy="57" r="5" fill="var(--muted)" opacity="0.5" />
      <rect x="150" y="49" width="300" height="16" rx="8" fill="none" stroke="var(--border)" />
      {/* 3d viewport helix */}
      {(() => {
        const N = 40;
        const strandA: [number, number][] = [];
        const strandB: [number, number][] = [];
        for (let i = 0; i <= N; i++) {
          const t = (i / N) * Math.PI * 3;
          const x = 140 + (i / N) * 360;
          strandA.push([x, 190 + Math.sin(t) * 70]);
          strandB.push([x, 190 + Math.sin(t + Math.PI) * 70]);
        }
        const toPath = (p: [number, number][]) => p.map((pt, i) => `${i === 0 ? "M" : "L"}${pt[0]},${pt[1]}`).join(" ");
        return (
          <>
            <path d={toPath(strandA)} fill="none" stroke="url(#oxview-g)" strokeWidth="3" strokeLinecap="round" />
            <path d={toPath(strandB)} fill="none" stroke="url(#oxview-g)" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
            {strandA.filter((_, i) => i % 6 === 0).map((p, i) => (
              <circle key={i} cx={p[0]} cy={p[1]} r="4" fill="#22d3ee" />
            ))}
          </>
        );
      })()}
      {/* selection handle / cursor */}
      <rect x="380" y="130" width="70" height="70" rx="6" fill="none" stroke="#a78bfa" strokeDasharray="4 4" strokeWidth="1.5" />
      <path d="M420 260 l14 30 l6 -12 l12 -6 z" fill="var(--foreground)" opacity="0.85" />
    </svg>
  );
}

function OxCloudArt() {
  return (
    <svg viewBox="0 0 640 360" className={WRAP} preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="oxcloud-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
      </defs>
      {/* cloud shape from overlapping circles */}
      <g fill="none" stroke="url(#oxcloud-g)" strokeWidth="3">
        <circle cx="230" cy="170" r="60" />
        <circle cx="310" cy="140" r="80" />
        <circle cx="400" cy="175" r="65" />
        <path d="M170 190 a60 60 0 0 0 60 60 h190 a55 55 0 0 0 0 -110" />
      </g>
      {/* GPU rack below */}
      {Array.from({ length: 4 }).map((_, i) => (
        <rect key={i} x={220 + i * 55} y="260" width="42" height="50" rx="4" fill="none" stroke="var(--border)" strokeWidth="1.5" />
      ))}
      {Array.from({ length: 4 }).map((_, i) => (
        <circle key={i} cx={241 + i * 55} cy="275" r="3" fill="#22d3ee" />
      ))}
      {/* connecting lines cloud -> rack */}
      <line x1="300" y1="250" x2="300" y2="260" stroke="var(--muted)" strokeWidth="1.5" />
      <line x1="340" y1="250" x2="340" y2="260" stroke="var(--muted)" strokeWidth="1.5" />
    </svg>
  );
}

function NanobaseArt() {
  const cards = Array.from({ length: 6 });
  return (
    <svg viewBox="0 0 640 360" className={WRAP} preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="nanobase-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
      </defs>
      {cards.map((_, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const x = 110 + col * 150;
        const y = 90 + row * 130;
        return (
          <g key={i}>
            <rect x={x} y={y} width="120" height="100" rx="8" fill="var(--card)" stroke="var(--border)" strokeWidth="1.5" />
            <circle cx={x + 60} cy={y + 38} r="18" fill="none" stroke="url(#nanobase-g)" strokeWidth="2.5" />
            <path d={`M${x + 45} ${y + 38} q15 -20 30 0 q-15 20 -30 0`} fill="none" stroke="url(#nanobase-g)" strokeWidth="1.5" />
            <rect x={x + 20} y={y + 68} width="80" height="6" rx="3" fill="var(--border)" />
            <rect x={x + 20} y={y + 80} width="50" height="6" rx="3" fill="var(--border)" />
          </g>
        );
      })}
    </svg>
  );
}

function FastDnaArt() {
  const N = 22;
  return (
    <svg viewBox="0 0 640 360" className={WRAP} preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="fastdna-g" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      {Array.from({ length: N }).map((_, i) => {
        const y0 = 30 + (i / N) * 300;
        const sway = Math.sin(i * 0.7) * 30;
        return (
          <path
            key={i}
            d={`M20 ${y0} Q 260 ${y0 + sway} 380 180 T 600 180`}
            fill="none"
            stroke="url(#fastdna-g)"
            strokeWidth="1.4"
            opacity={0.35 + (i % 5) * 0.1}
          />
        );
      })}
      {/* converged helix on the right */}
      {(() => {
        const M = 30;
        const a: [number, number][] = [];
        const b: [number, number][] = [];
        for (let i = 0; i <= M; i++) {
          const t = (i / M) * Math.PI * 3;
          const x = 400 + (i / M) * 200;
          a.push([x, 180 + Math.sin(t) * 55]);
          b.push([x, 180 + Math.sin(t + Math.PI) * 55]);
        }
        const toPath = (p: [number, number][]) => p.map((pt, i) => `${i === 0 ? "M" : "L"}${pt[0]},${pt[1]}`).join(" ");
        return (
          <>
            <path d={toPath(a)} fill="none" stroke="#22d3ee" strokeWidth="3" strokeLinecap="round" />
            <path d={toPath(b)} fill="none" stroke="#a78bfa" strokeWidth="3" strokeLinecap="round" />
          </>
        );
      })()}
    </svg>
  );
}

function NanoCanvasArt() {
  return (
    <svg viewBox="0 0 640 360" className={WRAP} preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="nanocanvas-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
      </defs>
      {/* grid canvas */}
      <rect x="60" y="50" width="360" height="260" rx="8" fill="none" stroke="var(--border)" strokeWidth="1.5" />
      {Array.from({ length: 9 }).map((_, i) => (
        <line key={`v${i}`} x1={60 + i * 45} y1="50" x2={60 + i * 45} y2="310" stroke="var(--border)" strokeWidth="1" opacity="0.5" />
      ))}
      {Array.from({ length: 6 }).map((_, i) => (
        <line key={`h${i}`} x1="60" y1={50 + i * 52} x2="420" y2={50 + i * 52} stroke="var(--border)" strokeWidth="1" opacity="0.5" />
      ))}
      {/* routed scaffold path */}
      <path
        d="M105 102 H285 V154 H150 V206 H330 V258"
        fill="none"
        stroke="url(#nanocanvas-g)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* agent node */}
      <g transform="translate(470,150)">
        <circle r="46" fill="var(--card)" stroke="url(#nanocanvas-g)" strokeWidth="2" />
        <path d="M-14 -6 h28 M-14 6 h28 M-14 -6 v12 M14 -6 v12" stroke="var(--foreground)" strokeWidth="2" strokeLinecap="round" />
      </g>
      <defs>
        <marker id="arrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill="var(--muted)" />
        </marker>
      </defs>
      <line x1="420" y1="160" x2="440" y2="160" stroke="var(--muted)" strokeWidth="1.5" markerEnd="url(#arrow)" />
    </svg>
  );
}

function PhysicsGraderArt() {
  const rows = Array.from({ length: 4 });
  return (
    <svg viewBox="0 0 640 360" className={WRAP} preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="pg-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
      </defs>
      <rect x="150" y="40" width="340" height="280" rx="10" fill="none" stroke="var(--border)" strokeWidth="2" />
      <rect x="180" y="66" width="180" height="14" rx="7" fill="var(--border)" />
      {rows.map((_, i) => (
        <g key={i} transform={`translate(180, ${110 + i * 55})`}>
          <circle cx="10" cy="0" r="12" fill="none" stroke="url(#pg-g)" strokeWidth="2.5" />
          <path d="M4 0 l4 5 l9 -10" fill="none" stroke="url(#pg-g)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="34" y="-6" width="220" height="6" rx="3" fill="var(--border)" />
          <rect x="34" y="6" width="150" height="6" rx="3" fill="var(--border)" opacity="0.6" />
        </g>
      ))}
      {/* small agent brain badge, top right */}
      <g transform="translate(460,80)">
        <circle r="30" fill="var(--card)" stroke="url(#pg-g)" strokeWidth="2" />
        <path
          d="M-10 -8 q10 -12 20 0 q6 4 0 10 q6 6 -4 10 q-4 6 -10 0 q-10 -2 -6 -12 q-6 -2 0 -8 Z"
          fill="none"
          stroke="var(--foreground)"
          strokeWidth="1.6"
        />
      </g>
    </svg>
  );
}

function PolycubesArt() {
  // isometric-ish cubes forming a small assembled cluster
  const cubes: [number, number, string][] = [
    [0, 0, "#22d3ee"],
    [1, 0, "#a78bfa"],
    [0, 1, "#a78bfa"],
    [1, 1, "#22d3ee"],
    [2, 0, "#22d3ee"],
    [1, -1, "#a78bfa"],
  ];
  const iso = (gx: number, gy: number) => {
    const x = 320 + (gx - gy) * 70;
    const y = 200 + (gx + gy) * 40;
    return [x, y];
  };
  function Cube({ gx, gy, color }: { gx: number; gy: number; color: string }) {
    const [x, y] = iso(gx, gy);
    const s = 56;
    const top = `${x},${y - s} ${x + s},${y - s / 2} ${x},${y} ${x - s},${y - s / 2}`;
    const left = `${x - s},${y - s / 2} ${x},${y} ${x},${y + s} ${x - s},${y + s / 2}`;
    const right = `${x + s},${y - s / 2} ${x},${y} ${x},${y + s} ${x + s},${y + s / 2}`;
    return (
      <g>
        <polygon points={top} fill={color} opacity="0.9" />
        <polygon points={left} fill={color} opacity="0.55" />
        <polygon points={right} fill={color} opacity="0.35" />
        <polygon points={top} fill="none" stroke="var(--background)" strokeWidth="1.5" />
        <polygon points={left} fill="none" stroke="var(--background)" strokeWidth="1.5" />
        <polygon points={right} fill="none" stroke="var(--background)" strokeWidth="1.5" />
      </g>
    );
  }
  return (
    <svg viewBox="0 0 640 360" className={WRAP} preserveAspectRatio="xMidYMid slice">
      {cubes.map(([gx, gy, color], i) => (
        <Cube key={i} gx={gx} gy={gy} color={color} />
      ))}
    </svg>
  );
}

const REGISTRY: Record<string, () => ReactElement> = {
  oxdna: OxDnaArt,
  oxview: OxViewArt,
  oxcloud: OxCloudArt,
  nanobase: NanobaseArt,
  fastdna: FastDnaArt,
  nanocanvas: NanoCanvasArt,
  physicsgrader: PhysicsGraderArt,
  "dna-polycubes": PolycubesArt,
};

export function ProjectIllustration({ id }: { id: string }) {
  const Art = REGISTRY[id] ?? OxDnaArt;
  return (
    <div className="card-surface aspect-[16/9] w-full overflow-hidden">
      <Art />
    </div>
  );
}
