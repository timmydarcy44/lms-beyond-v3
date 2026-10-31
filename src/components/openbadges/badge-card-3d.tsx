"use client";

import { useEffect, useRef, useState } from "react";
import type { BadgeVerificationState } from "@/lib/openbadges/v3/public-badge";
import styles from "./badge-card-3d.module.css";

type Props = {
  name: string;
  recipientName: string;
  issuedLabel: string;
  level: number | null;
  imageUrl?: string | null;
  state?: BadgeVerificationState;
};

const EDGES = [
  "linear-gradient(160deg, #9A9BA6, #6A6B76)",
  "linear-gradient(160deg, #5E5F69, #3C3D46)",
  "linear-gradient(160deg, #3C3D46, #24252C)",
  "linear-gradient(160deg, #24252C, #181920)",
  "linear-gradient(160deg, #181920, #101116)",
  "linear-gradient(160deg, #101116, #0A0B0F)",
  "#0A0B0F",
];

const DOT: Record<BadgeVerificationState, string> = {
  verified: "#2FD08A",
  expired: "#F5B942",
  revoked: "#F07167",
  invalid: "#F07167",
};

const REST = { x: 12, y: -16, z: 3 };

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function BadgeCard3D({ name, recipientName, issuedLabel, level, imageUrl, state = "verified" }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);
  const [photoOk, setPhotoOk] = useState(Boolean(imageUrl));

  useEffect(() => {
    setPhotoOk(Boolean(imageUrl));
  }, [imageUrl]);

  useEffect(() => {
    const card = cardRef.current;
    const shadow = shadowRef.current;
    const stage = card?.parentElement;
    if (!card || !shadow || !stage) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    let target = { ...REST };
    let current = { ...REST };
    let hovering = false;
    let oriented = false;
    let frame = 0;

    const paint = () => {
      card.style.transform = `rotateX(${current.x}deg) rotateY(${current.y}deg) rotateZ(${current.z}deg)`;
      const dx = current.y - REST.y;
      const dy = current.x - REST.x;
      card.style.setProperty("--shine-x", `${42 + dx * 1.6}%`);
      card.style.setProperty("--shine-y", `${20 + dy * 1.4}%`);
      card.style.setProperty("--angle", `${120 + dx * 6}deg`);
      shadow.style.setProperty("--shadow-x", `${18 - dx * 1.4}px`);
      shadow.style.setProperty("--shadow-y", `${8 + dy * 0.6}px`);
    };

    const tick = () => {
      if (!fine && !hovering && !oriented && !reduce) {
        const t = performance.now() / 1000;
        target = { x: REST.x + Math.sin(t * 0.9) * 3.5, y: REST.y + Math.cos(t * 0.7) * 5, z: REST.z };
      }
      current = {
        x: current.x + (target.x - current.x) * 0.12,
        y: current.y + (target.y - current.y) * 0.12,
        z: current.z + (target.z - current.z) * 0.12,
      };
      paint();
      const settled = Math.abs(target.x - current.x) + Math.abs(target.y - current.y) < 0.05;
      if (reduce || (settled && !hovering && (fine || oriented))) return;
      frame = requestAnimationFrame(tick);
    };

    const start = () => {
      cancelAnimationFrame(frame);
      if (!reduce) frame = requestAnimationFrame(tick);
      else paint();
    };

    paint();
    if (!reduce && !fine) start();

    const onMove = (event: PointerEvent) => {
      if (!fine || reduce) return;
      const rect = stage.getBoundingClientRect();
      const px = clamp((event.clientX - rect.left) / rect.width - 0.5, -0.5, 0.5);
      const py = clamp((event.clientY - rect.top) / rect.height - 0.5, -0.5, 0.5);
      hovering = true;
      target = { x: REST.x + -py * 2 * 14, y: REST.y + px * 2 * 14, z: REST.z };
      start();
    };
    const onLeave = () => {
      hovering = false;
      target = { ...REST };
      start();
    };
    const onOrientation = (event: DeviceOrientationEvent) => {
      oriented = true;
      const beta = event.beta ?? 0;
      const gamma = event.gamma ?? 0;
      target = {
        x: REST.x + clamp((beta - 40) / 40, -1, 1) * 14,
        y: REST.y + clamp(gamma / 28, -1, 1) * 14,
        z: REST.z,
      };
      start();
    };
    const askOrientation = () => {
      if (fine || reduce) return;
      const orientation = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> };
      if (typeof orientation.requestPermission !== "function") {
        window.addEventListener("deviceorientation", onOrientation);
        return;
      }
      void orientation.requestPermission().then((result) => {
        if (result === "granted") window.addEventListener("deviceorientation", onOrientation);
      }).catch(() => undefined);
    };

    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("pointerleave", onLeave);
    stage.addEventListener("pointerdown", askOrientation);
    return () => {
      cancelAnimationFrame(frame);
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerleave", onLeave);
      stage.removeEventListener("pointerdown", askOrientation);
      window.removeEventListener("deviceorientation", onOrientation);
    };
  }, []);

  return (
    <div className={styles.stage}>
      <div ref={shadowRef} className={styles.shadow} />
      <div className={styles.perspective}>
        <div ref={cardRef} className={styles.card} data-badge-card="true" aria-hidden="true">
          {EDGES.map((background, index) => (
            <span
              key={background}
              className={styles.layer}
              style={{
                background,
                transform: `translateZ(-${index + 1}px)`,
                boxShadow: index === EDGES.length - 1 ? "30px 50px 80px rgba(0,0,0,0.75)" : undefined,
              }}
            />
          ))}
          <div className={styles.face}>
            <div className={styles.brush} />
            <div className={styles.light} />
            <div className={styles.shine} />
            <div className={styles.content}>
              <div className="flex items-start justify-between gap-3">
                <span className={styles.brand}>Byound</span>
                <span className={styles.standard}>
                  <span className={styles.dot} style={{ background: DOT[state], boxShadow: `0 0 8px ${DOT[state]}` }} />
                  Open Badge 3.0
                </span>
              </div>
              <div className={styles.middle}>
                <div className={styles.holo}>
                  <div className={styles.stripes} />
                  {photoOk && imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imageUrl} alt="" className={styles.photo} onError={() => setPhotoOk(false)} />
                  ) : (
                    <span className={styles.emblem}>B</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className={styles.name}>{name}</p>
                  {level != null ? <p className={styles.level}>Niveau {level}</p> : null}
                </div>
              </div>
              <div className={styles.footer}>
                {recipientName ? (
                  <div>
                    <p className={styles.label}>Titulaire</p>
                    <p>{recipientName}</p>
                  </div>
                ) : <span />}
                <div className="text-right">
                  <p className={styles.label}>Obtenu le</p>
                  <p>{issuedLabel}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <p className={`${styles.hint} ${styles.desktopHint}`}>Survolez la carte pour la faire pivoter</p>
      <p className={`${styles.hint} ${styles.mobileHint}`}>Inclinez votre téléphone</p>
    </div>
  );
}
