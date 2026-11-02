import { cn } from "@/lib/utils";

export function MetalBadgeCard({
  titre,
  sousTitre = "Open Badge",
  titulaire,
  date,
  teinte = "#C9C2FF",
  className,
}: {
  titre: string;
  sousTitre?: string;
  titulaire: string;
  date: string;
  teinte?: string;
  className?: string;
}) {
  return (
    <div className={cn("w-full [perspective:1400px]", className)}>
      <article
        className="relative aspect-[560/340] overflow-hidden rounded-[28px] text-[#F2F2F4] shadow-[0_60px_120px_#000000B3,inset_0_1px_0_#FFFFFF38] [transform:rotateX(12deg)]"
        style={{ background: "linear-gradient(125deg, #1A1B22, #2C2D36 28%, #15161C 52%, #33343F 74%, #17181E)" }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: "linear-gradient(105deg, transparent 28%, rgba(201,194,255,0.28) 46%, rgba(143,242,196,0.18) 58%, transparent 74%)" }}
        />
        <div aria-hidden className="pointer-events-none absolute -right-6 -top-8 h-36 w-36 rounded-full border border-white/25" />
        <div aria-hidden className="pointer-events-none absolute right-4 top-8 h-24 w-24 rounded-full border border-white/15" />
        <div className="relative flex h-full flex-col justify-between p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3 text-[13px]">
            <span className="font-extrabold tracking-[-0.04em]">Byound</span>
            <span className="font-extrabold text-[#2FD08A]">✓ Vérifié</span>
          </div>
          <div className="flex items-center gap-3">
            <div
              aria-hidden
              className="h-12 w-12 shrink-0 rounded-2xl"
              style={{ background: `conic-gradient(from 20deg, ${teinte}, #7E6CFF, #8FF2C4, #F5C85C, ${teinte})` }}
            />
            <div>
              <p className="text-[12px] text-white/60">{sousTitre}</p>
              <p className="line-clamp-2 text-[18px] font-extrabold leading-tight tracking-[-0.04em] sm:text-[22px]">{titre}</p>
            </div>
          </div>
          <div className="flex items-end justify-between gap-3 text-[13px]">
            <div>
              <p className="text-white/50">Titulaire</p>
              <p className="font-extrabold">{titulaire}</p>
            </div>
            <div className="text-right">
              <p className="text-white/50">Date</p>
              <p className="font-extrabold">{date}</p>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
