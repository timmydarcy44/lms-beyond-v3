"use client";

import * as React from "react";
import { motion } from "framer-motion";

type NodeRef = React.RefObject<HTMLDivElement | null>;

function getCenterBottom(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.bottom };
}
function getCenterTop(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top };
}

function makePath(a: { x: number; y: number }, b: { x: number; y: number }) {
  const dx = 0;
  const midY = (a.y + b.y) / 2;
  return `M ${a.x} ${a.y} C ${a.x + dx} ${midY}, ${b.x - dx} ${midY}, ${b.x} ${b.y}`;
}

function useConnectorPath(fromRef: NodeRef, toRef: NodeRef) {
  const [d, setD] = React.useState<string>("");

  const recompute = React.useCallback(() => {
    const from = fromRef.current;
    const to = toRef.current;
    if (!from || !to) return;

    const a = getCenterBottom(from);
    const b = getCenterTop(to);

    setD(makePath(a, b));
  }, [fromRef, toRef]);

  React.useEffect(() => {
    recompute();
    const onResize = () => recompute();
    window.addEventListener("resize", onResize);

    const onScroll = () => recompute();
    window.addEventListener("scroll", onScroll, true);

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [recompute]);

  return d;
}

function AnimatedConnector({
  fromRef,
  toRef,
  visible = true,
}: {
  fromRef: NodeRef;
  toRef: NodeRef;
  visible?: boolean;
}) {
  const d = useConnectorPath(fromRef, toRef);

  if (!visible || !d) return null;

  return (
    <svg className="pointer-events-none fixed inset-0 z-[10005]">
      <motion.path
        d={d}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        className="text-cyan-400/80"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      />
      <motion.circle
        r="4"
        fill="currentColor"
        className="text-cyan-300"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <animateMotion dur="1.2s" repeatCount="indefinite" path={d} />
      </motion.circle>
    </svg>
  );
}

export function ZapierRail({
  trigger,
  condition,
  actions,
  hasCondition,
  canAddAction,
  conditionToggleDisabled = false,
  onAddCondition,
  onRemoveCondition,
  onAddAction,
}: {
  trigger: React.ReactNode;
  condition?: React.ReactNode | null;
  actions: React.ReactNode;
  hasCondition: boolean;
  canAddAction: boolean;
  conditionToggleDisabled?: boolean;
  onAddCondition: () => void;
  onRemoveCondition: () => void;
  onAddAction: () => void;
}) {
  const triggerRef = React.useRef<HTMLDivElement>(null);
  const conditionRef = React.useRef<HTMLDivElement>(null);
  const actionsRef = React.useRef<HTMLDivElement>(null);

  const conditionVisible = hasCondition && Boolean(condition);

  return (
    <div className="relative">
      <AnimatedConnector fromRef={triggerRef} toRef={conditionVisible ? conditionRef : actionsRef} />
      {conditionVisible ? <AnimatedConnector fromRef={conditionRef} toRef={actionsRef} /> : null}

      <div className="mx-auto w-full max-w-4xl space-y-6">
        <div
          ref={triggerRef}
          className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-lg shadow-black/20 backdrop-blur"
        >
          <div className="mb-2 flex items-center justify-between">
            <div className="text-xs font-semibold uppercase tracking-[0.3em] text-white/45">
              Déclencheur
            </div>
            <span className="rounded-full border border-cyan-400/40 px-2 py-0.5 text-[10px] uppercase tracking-[0.32em] text-cyan-200/80">
              ON
            </span>
          </div>
          {trigger}
        </div>

        <div className="flex items-center justify-center py-3">
          {!hasCondition ? (
            <button
              type="button"
              onClick={onAddCondition}
              className="flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm text-white hover:border-white/25 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={conditionToggleDisabled}
            >
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/25 text-xs">
                +
              </span>
              Ajouter une condition
            </button>
          ) : (
            <button
              type="button"
              onClick={onRemoveCondition}
              className="flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm text-white hover:border-white/25 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={conditionToggleDisabled}
            >
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/25 text-xs">
                ✕
              </span>
              Retirer la condition
            </button>
          )}
        </div>

        {conditionVisible ? (
          <>
            <div
              ref={conditionRef}
              className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-lg shadow-black/20 backdrop-blur"
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="text-xs font-semibold uppercase tracking-[0.3em] text-white/45">
                  Filtre
                </div>
                <span className="rounded-full border border-amber-300/40 px-2 py-0.5 text-[10px] uppercase tracking-[0.32em] text-amber-100/80">
                  Active
                </span>
              </div>
              {condition}
            </div>

            <div className="flex items-center justify-center py-3">
              <button
                type="button"
                onClick={onAddAction}
                className="flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm text-white hover:border-white/25 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                disabled={!canAddAction}
              >
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/25 text-xs">
                  +
                </span>
                Ajouter une action
              </button>
            </div>
          </>
        ) : (
          <div className="py-2" />
        )}

        <div
          ref={actionsRef}
          className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-lg shadow-black/20 backdrop-blur"
        >
          <div className="mb-2 flex items-center justify-between">
            <div className="text-xs font-semibold uppercase tracking-[0.3em] text-white/45">
              Actions
            </div>
            <span className="rounded-full border border-emerald-300/40 px-2 py-0.5 text-[10px] uppercase tracking-[0.32em] text-emerald-100/80">
              Flow
            </span>
          </div>
          {actions}

          <div className="mt-5 flex justify-center">
            <button
              type="button"
              onClick={onAddAction}
              className="flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2 text-sm text-white hover:border-white/30 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={!canAddAction}
            >
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/25 text-xs">
                +
              </span>
              Ajouter une action
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

