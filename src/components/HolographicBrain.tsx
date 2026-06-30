import { useEffect, useRef } from "react";
import { PersonaId } from "../types";

interface HolographicBrainProps {
  persona: PersonaId;
  isSpeaking: boolean;
  isListening: boolean;
  topics: { [key: string]: number };
}

interface Node3D {
  th: number;
  ph: number;
  r: number;
  sp: number;
  sz: number;
}

interface Conn {
  a: number;
  b: number;
  off: number;
}

interface Ring3D {
  rx: number;
  ry: number;
  ang: number;
  sp: number;
  tilt: number;
}

interface Arc3D {
  s: number;
  span: number;
  r: number;
  sp: number;
  ang: number;
  al: number;
}

export default function HolographicBrain({
  persona,
  isSpeaking,
  isListening,
  topics,
}: HolographicBrainProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const topicCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Constants
  const W = 260;
  const H = 260;
  const CX = 130;
  const CY = 130;
  const R = 90;

  // Initialize nodes and conns inside refs to persist across renders
  const nodesRef = useRef<Node3D[]>([]);
  const connsRef = useRef<Conn[]>([]);
  const ringsRef = useRef<Ring3D[]>([]);
  const arcsRef = useRef<Arc3D[]>([]);

  if (nodesRef.current.length === 0) {
    const nodes: Node3D[] = [];
    for (let i = 0; i < 140; i++) {
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      nodes.push({
        th,
        ph,
        r: R + (Math.random() - 0.5) * 16,
        sp: (Math.random() - 0.5) * 0.003,
        sz: Math.random() * 2.2 + 0.5,
      });
    }
    nodesRef.current = nodes;

    const conns: Conn[] = [];
    for (let i = 0; i < 85; i++) {
      const a = Math.floor(Math.random() * nodes.length);
      let b = Math.floor(Math.random() * nodes.length);
      while (b === a) b = Math.floor(Math.random() * nodes.length);
      conns.push({ a, b, off: Math.random() * Math.PI * 2 });
    }
    connsRef.current = conns;

    const rings: Ring3D[] = [
      { rx: R * 1.22, ry: R * 0.32, ang: 0, sp: 0.004, tilt: 0.4 },
      { rx: R * 1.12, ry: R * 0.25, ang: 1.1, sp: -0.006, tilt: 1.1 },
      { rx: R * 1.32, ry: R * 0.2, ang: 2.2, sp: 0.003, tilt: 0.8 },
    ];
    ringsRef.current = rings;

    const arcs: Arc3D[] = [];
    for (let i = 0; i < 7; i++) {
      arcs.push({
        s: Math.random() * Math.PI * 2,
        span: 0.4 + Math.random() * 0.7,
        r: R * (0.87 + Math.random() * 0.28),
        sp: (Math.random() - 0.5) * 0.018,
        ang: 0,
        al: Math.random(),
      });
    }
    arcsRef.current = arcs;
  }

  // Active theme helper
  const getColor = () => {
    return persona === "friday"
      ? { r: 255, g: 45, b: 85, hex: "#ff2d55" }
      : { r: 0, g: 212, b: 255, hex: "#00d4ff" };
  };

  const proj = (th: number, ph: number, rr: number, rotY: number) => {
    const x = rr * Math.sin(ph) * Math.cos(th + rotY);
    const y = rr * Math.cos(ph);
    const z = rr * Math.sin(ph) * Math.sin(th + rotY);
    return {
      sx: CX + x * 0.88,
      sy: CY + y * 0.88,
      z,
      vis: z > -R * 0.1,
    };
  };

  useEffect(() => {
    let animFrameId: number;
    let t = 0;

    const draw = () => {
      t += 1;
      const ctx = canvasRef.current?.getContext("2d");
      const tctx = topicCanvasRef.current?.getContext("2d");

      if (!ctx || !tctx) return;

      const { r, g, b } = getColor();
      const rotY = t * 0.0007;
      const pulse = isSpeaking ? 1 + 0.22 * Math.sin(t * 0.055) : 1 + 0.035 * Math.sin(t * 0.003);

      // --- Brain Canvas drawing ---
      ctx.clearRect(0, 0, W, H);

      // Radial background glow
      const g1 = ctx.createRadialGradient(CX, CY, R * 0.15, CX, CY, R * 1.4 * pulse);
      g1.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${isSpeaking ? 0.22 : 0.1})`);
      g1.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
      ctx.fillStyle = g1;
      ctx.beginPath();
      ctx.arc(CX, CY, R * 1.4 * pulse, 0, Math.PI * 2);
      ctx.fill();

      // Core intensity glow
      const g2 = ctx.createRadialGradient(CX, CY - 12, 8, CX, CY, R * pulse);
      g2.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.2)`);
      g2.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, 0.05)`);
      g2.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
      ctx.fillStyle = g2;
      ctx.beginPath();
      ctx.arc(CX, CY, R * pulse, 0, Math.PI * 2);
      ctx.fill();

      // Orbit rings
      ringsRef.current.forEach((rg) => {
        rg.ang += rg.sp * (isSpeaking ? 1.8 : 1);
        ctx.save();
        ctx.translate(CX, CY);
        ctx.rotate(rg.ang);
        ctx.scale(1, Math.sin(rg.tilt + t * 0.0004) * 0.55 + 0.12);
        ctx.beginPath();
        ctx.ellipse(0, 0, rg.rx * pulse, rg.ry * pulse, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${isSpeaking ? 0.65 : 0.3})`;
        ctx.lineWidth = isSpeaking ? 1.3 : 0.7;
        ctx.stroke();
        ctx.restore();
      });

      // Animated arcs
      arcsRef.current.forEach((a) => {
        a.ang += a.sp * (isSpeaking ? 2 : 1);
        ctx.beginPath();
        ctx.arc(CX, CY, a.r * pulse, a.s + a.ang, a.s + a.ang + a.span);
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${Math.min((isSpeaking ? 0.9 : 0.5) * (0.3 + 0.4 * a.al), 1)})`;
        ctx.lineWidth = isSpeaking ? 1.8 : 0.9;
        ctx.stroke();
      });

      // Project 3D nodes
      const projectedNodes = nodesRef.current.map((n, idx) => {
        n.th += n.sp * (isSpeaking ? 2.2 : 1);
        return proj(n.th, n.ph, n.r * pulse, rotY);
      });

      // Draw connections
      connsRef.current.forEach(({ a, b: bb, off }) => {
        const pa = projectedNodes[a];
        const pb = projectedNodes[bb];
        if (!pa || !pb || !pa.vis || !pb.vis) return;

        const dist = Math.hypot(pa.sx - pb.sx, pa.sy - pb.sy);
        if (dist > 70) return;

        const al = (1 - dist / 70) * 0.42 * (isSpeaking ? 1.4 : 1);
        const flow = Math.sin(t * 0.018 + off) * 0.5 + 0.5;

        const gl = ctx.createLinearGradient(pa.sx, pa.sy, pb.sx, pb.sy);
        gl.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0)`);
        gl.addColorStop(flow, `rgba(${r}, ${g}, ${b}, ${al})`);
        gl.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

        ctx.beginPath();
        ctx.moveTo(pa.sx, pa.sy);
        ctx.lineTo(pb.sx, pb.sy);
        ctx.strokeStyle = gl;
        ctx.lineWidth = 0.55;
        ctx.stroke();
      });

      // Draw physical nodes
      projectedNodes.forEach((p, i) => {
        if (!p.vis) return;
        const n = nodesRef.current[i];
        const depth = (p.z + R) / (2 * R);
        const al = 0.3 + depth * 0.7;
        const sz = n.sz * (0.5 + depth * 0.7) * pulse;
        const fl = isSpeaking ? 0.7 + 0.3 * Math.sin(t * 0.07 + i) : 0.85 + 0.15 * Math.sin(t * 0.009 + i);

        ctx.beginPath();
        ctx.arc(p.sx, p.sy, sz, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${al * fl})`;
        ctx.fill();

        if (sz > 1.4) {
          ctx.beginPath();
          ctx.arc(p.sx, p.sy, sz * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.06)`;
          ctx.fill();
        }
      });

      // Glowing center sun
      const gc = ctx.createRadialGradient(CX, CY, 0, CX, CY, 24 * pulse);
      gc.addColorStop(0, `rgba(255, 255, 255, ${isSpeaking ? 0.9 : 0.72})`);
      gc.addColorStop(0.3, `rgba(${r}, ${g}, ${b}, 0.9)`);
      gc.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
      ctx.beginPath();
      ctx.arc(CX, CY, 24 * pulse, 0, Math.PI * 2);
      ctx.fillStyle = gc;
      ctx.fill();

      // --- Topic Canvas drawing ---
      tctx.clearRect(0, 0, W, H);
      const sortedTopics = Object.entries(topics)
        .sort((x, y) => y[1] - x[1])
        .slice(0, 6);

      if (sortedTopics.length >= 2) {
        sortedTopics.forEach(([theme, cnt], idx) => {
          const angle = (idx / sortedTopics.length) * Math.PI * 2 + t * 0.0005;
          const rad = R * (0.6 + Math.min(cnt, 6) * 0.04);
          const x = CX + Math.cos(angle) * rad * 0.85;
          const y = CY + Math.sin(angle) * rad * 0.6;
          const alpha = Math.min(0.3 + cnt * 0.12, 0.9);

          // Connection line to central sun
          tctx.beginPath();
          tctx.moveTo(CX, CY);
          tctx.lineTo(x, y);
          tctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.4})`;
          tctx.lineWidth = 0.8;
          tctx.setLineDash([3, 4]);
          tctx.stroke();
          tctx.setLineDash([]);

          // Glowing topic projection dot
          tctx.beginPath();
          tctx.arc(x, y, 4 + cnt, 0, Math.PI * 2);
          tctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.7})`;
          tctx.fill();

          // Text label
          const shortName = theme.split("&")[0].trim();
          tctx.font = `10px 'Space Grotesk', 'Segoe UI', Arial`;
          tctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
          tctx.textAlign = "center";
          tctx.fillText(shortName, x, y - 10);

          // Connect to neighbor topic dot
          if (idx > 0) {
            const prevAngle = ((idx - 1) / sortedTopics.length) * Math.PI * 2 + t * 0.0005;
            const prevRad = R * (0.6 + Math.min(sortedTopics[idx - 1][1], 6) * 0.04);
            const px = CX + Math.cos(prevAngle) * prevRad * 0.85;
            const py = CY + Math.sin(prevAngle) * prevRad * 0.6;

            tctx.beginPath();
            tctx.moveTo(px, py);
            tctx.lineTo(x, y);
            tctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.25})`;
            tctx.lineWidth = 0.55;
            tctx.setLineDash([2, 5]);
            tctx.stroke();
            tctx.setLineDash([]);
          }
        });
      }

      animFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animFrameId);
    };
  }, [persona, isSpeaking, topics]);

  return (
    <div className="brain-wrap relative w-[260px] h-[260px] mx-auto mb-2 flex items-center justify-center">
      {/* Primary animated background canvas */}
      <canvas
        ref={canvasRef}
        id="brainCanvas"
        width={W}
        height={H}
        className="absolute top-0 left-0"
      />
      {/* Secondary topic overlay canvas */}
      <canvas
        ref={topicCanvasRef}
        id="topicCanvas"
        width={W}
        height={H}
        className="absolute top-0 left-0 pointer-events-none"
      />
      {/* Interactive physical listening ring */}
      <div
        id="listenRing"
        className={`listening-ring absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] border-2 rounded-full opacity-0 pointer-events-none ${
          isListening ? "listening-ring-anim border-[var(--ac)] active" : ""
        }`}
      />
    </div>
  );
}
