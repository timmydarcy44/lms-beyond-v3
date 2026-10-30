"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const GUIDE = "Lumière naturelle, de face, épaules visibles, fond neutre, sourire naturel.";

export function CarePhotoField({
  expertId,
  value,
  onChange,
}: {
  expertId: string;
  value: string | null;
  onChange: (url: string) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  async function onFile(file: File) {
    setError(null);
    if (!["image/jpeg", "image/webp", "image/png"].includes(file.type)) {
      setError("Utilisez un JPEG ou un WebP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("5 Mo maximum.");
      return;
    }
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      if (image.naturalWidth < 800 || image.naturalHeight < 1000) {
        setError("La photo doit faire au moins 800 × 1000 px.");
        URL.revokeObjectURL(url);
        return;
      }
      imageRef.current = image;
      setDraft(url);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    };
    image.src = url;
  }

  function exportCanvas(size: number) {
    const image = imageRef.current;
    if (!image) return null;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = Math.round(size * 1.25);
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const frameRatio = 4 / 5;
    const imageRatio = image.naturalWidth / image.naturalHeight;
    let drawW = image.naturalWidth;
    let drawH = image.naturalHeight;
    if (imageRatio > frameRatio) drawW = image.naturalHeight * frameRatio;
    else drawH = image.naturalWidth / frameRatio;
    drawW /= zoom;
    drawH /= zoom;
    const sx = Math.min(Math.max((image.naturalWidth - drawW) / 2 - offset.x, 0), image.naturalWidth - drawW);
    const sy = Math.min(Math.max((image.naturalHeight - drawH) / 2 - offset.y, 0), image.naturalHeight - drawH);
    ctx.drawImage(image, sx, sy, drawW, drawH, 0, 0, canvas.width, canvas.height);
    return canvas;
  }

  async function save() {
    const large = exportCanvas(800);
    const small = exportCanvas(400);
    if (!large || !small) return;
    setBusy(true);
    setError(null);
    const supabase = createClient();
    if (!supabase) {
      setBusy(false);
      setError("Connexion impossible.");
      return;
    }
    const stamp = Date.now();
    const blob = (canvas: HTMLCanvasElement) =>
      new Promise<Blob | null>((resolve) => canvas.toBlob((value) => resolve(value), "image/jpeg", 0.9));
    const [largeBlob, smallBlob] = await Promise.all([blob(large), blob(small)]);
    if (!largeBlob || !smallBlob) {
      setBusy(false);
      setError("Recadrage impossible.");
      return;
    }
    const largePath = `${expertId}/portrait-${stamp}.jpg`;
    const smallPath = `${expertId}/portrait-${stamp}-400.jpg`;
    const bucket = "practitioner-photos";
    const uploaded = await supabase.storage.from(bucket).upload(largePath, largeBlob, { upsert: true, contentType: "image/jpeg" });
    const target = uploaded.error ? "care-avatars" : bucket;
    if (uploaded.error) {
      const fallback = await supabase.storage.from(target).upload(largePath, largeBlob, { upsert: true, contentType: "image/jpeg" });
      if (fallback.error) {
        setBusy(false);
        setError("Envoi de la photo impossible. Appliquez la migration du bucket practitioner-photos.");
        return;
      }
    }
    await supabase.storage.from(target).upload(smallPath, smallBlob, { upsert: true, contentType: "image/jpeg" });
    const { data } = supabase.storage.from(target).getPublicUrl(largePath);
    onChange(data.publicUrl);
    setDraft(null);
    setBusy(false);
  }

  return (
    <div className="grid gap-3 sm:grid-cols-[220px_minmax(0,1fr)]">
      <div>
        {value && !draft ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="h-[260px] w-[208px] rounded-[26px] object-cover" />
        ) : (
          <div className="flex h-[260px] w-[208px] items-center justify-center rounded-[26px] bg-[linear-gradient(160deg,#D6005F,#8E003D)] text-[64px] font-extrabold text-white">
            {draft ? "" : "·"}
          </div>
        )}
      </div>
      <div className="grid content-start gap-3">
        <p className="text-sm text-white/70">{GUIDE}</p>
        <label className="text-sm">
          Photo 4:5, JPEG ou WebP, 5 Mo max
          <input
            className="mt-2 block w-full text-sm"
            type="file"
            accept="image/jpeg,image/webp,image/png"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void onFile(file);
            }}
          />
        </label>
        {draft ? (
          <div className="grid gap-2">
            <div
              className="relative h-[250px] w-[200px] overflow-hidden rounded-2xl bg-black"
              onPointerDown={(event) => {
                drag.current = { x: event.clientX, y: event.clientY, ox: offset.x, oy: offset.y };
              }}
              onPointerMove={(event) => {
                if (!drag.current) return;
                setOffset({
                  x: drag.current.ox + (event.clientX - drag.current.x),
                  y: drag.current.oy + (event.clientY - drag.current.y),
                });
              }}
              onPointerUp={() => {
                drag.current = null;
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={draft}
                alt=""
                draggable={false}
                className="absolute left-1/2 top-1/2 max-w-none select-none"
                style={{
                  width: `${100 * zoom}%`,
                  transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
                }}
              />
            </div>
            <label className="text-xs">
              Zoom
              <input className="ml-2 align-middle" type="range" min={1} max={2.4} step={0.05} value={zoom} onChange={(event) => setZoom(Number(event.target.value))} />
            </label>
            <button type="button" disabled={busy} className="h-10 w-fit rounded-full bg-[#CE0058] px-4 text-sm font-bold text-white" onClick={() => void save()}>
              {busy ? "Envoi…" : "Enregistrer le cadrage"}
            </button>
          </div>
        ) : null}
        {error ? <p className="text-sm text-[#FFB4B8]">{error}</p> : null}
      </div>
    </div>
  );
}
