"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Particle = { x: number; y: number; vx: number; vy: number; r: number };

function SynapticCanvas({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio ?? 1, 2);
      const { clientWidth, clientHeight } = canvas;
      canvas.width = clientWidth * dpr;
      canvas.height = clientHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.min(48, Math.floor((clientWidth * clientHeight) / 18000));
      particlesRef.current = Array.from({ length: n }, () => ({
        x: Math.random() * clientWidth,
        y: Math.random() * clientHeight,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: 0.6 + Math.random() * 1.4,
      }));
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      const pts = particlesRef.current;
      for (let i = 0; i < pts.length; i += 1) {
        const p = pts[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = i % 2 === 0 ? "rgba(255,255,255,0.42)" : "rgba(147,197,253,0.45)";
        ctx.fill();
        for (let j = i + 1; j < pts.length; j += 1) {
          const q = pts[j];
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const d = Math.hypot(dx, dy);
          if (d < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            const alpha = 0.14 * (1 - d / 120);
            ctx.strokeStyle = j % 2 === 0 ? `rgba(255,255,255,${alpha})` : `rgba(147,197,253,${alpha * 1.1})`;
            ctx.lineWidth = 0.55;
            ctx.stroke();
          }
        }
      }
      frameRef.current = requestAnimationFrame(draw);
    };
    frameRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return <canvas ref={ref} className={cn("absolute inset-0 h-full w-full", className)} aria-hidden />;
}

export type QuizWelcomeProps = {
  title: string;
  questionCount: number;
  minScorePercent: number;
  onStart: () => void;
  onQuit?: () => void;
  fullscreen?: boolean;
  className?: string;
};

export function QuizWelcome({ title, questionCount, minScorePercent, onStart, onQuit, fullscreen, className }: QuizWelcomeProps) {
  return (
    <div
      className={cn(
        "relative flex h-[100dvh] max-h-[100dvh] flex-col items-center justify-center overflow-hidden px-6 py-8",
        "bg-[#030712]",
        fullscreen && "min-h-[100dvh]",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#020617] via-[#0c1222] to-[#1e1b4b]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(99,102,241,0.12),_transparent_55%)]" />
      <SynapticCanvas />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 mx-auto w-full max-w-lg rounded-3xl border border-white/10 bg-white/5 p-8 shadow-[0_0_60px_rgba(99,102,241,0.15)] backdrop-blur-xl sm:p-10"
      >
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/15 bg-white/10 shadow-inner ring-1 ring-violet-500/20">
            <Trophy className="h-8 w-8 text-violet-300" strokeWidth={1.35} />
          </div>
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-violet-200/90">Quiz</p>
            <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">{title}</h1>
            <p className="text-sm font-medium text-slate-300/95">
              {questionCount} question{questionCount > 1 ? "s" : ""} · Objectif suggéré {minScorePercent}%
            </p>
          </div>
          <Button
            onClick={onStart}
            className="h-14 w-full max-w-md animate-pulse rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-10 text-lg font-extrabold tracking-tight text-white shadow-[0_0_28px_rgba(139,92,246,0.55)] transition hover:from-violet-500 hover:to-indigo-500 hover:shadow-[0_0_40px_rgba(99,102,241,0.65)]"
          >
            Démarrer le quiz
          </Button>
          {onQuit ? (
            <Button type="button" variant="ghost" onClick={onQuit} className="text-sm font-semibold text-slate-300 hover:bg-white/10 hover:text-white">
              Quitter
            </Button>
          ) : null}
        </div>
      </motion.div>
    </div>
  );
}
