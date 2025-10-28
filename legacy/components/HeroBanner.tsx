import Image from 'next/image'
import Link from 'next/link'

export default function HeroBanner({
  title,
  description,
  coverUrl,
  ctaHref,
}: {
  title: string
  description?: string
  coverUrl?: string | null
  ctaHref: string
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-b from-white/[0.06] to-white/[0.02]">
      {coverUrl && (
        <Image
          alt={title}
          src={coverUrl}
          width={2400}
          height={900}
          className="absolute inset-0 h-full w-full object-cover opacity-60"
        />
      )}
      <div className="relative z-10 p-10 md:p-14">
        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight drop-shadow-sm">{title}</h2>
        {description && <p className="mt-4 text-white/80 max-w-2xl">{description}</p>}
        <div className="mt-8 flex gap-3">
          <Link
            href={ctaHref}
            className="rounded-xl px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-fuchsia-600 text-white font-medium hover:brightness-110 transition"
          >
            Ouvrir
          </Link>
          <Link
            href={ctaHref}
            className="rounded-xl px-5 py-2.5 bg-white/10 hover:bg-white/15 border border-white/10 transition"
          >
            En savoir plus
          </Link>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0b0d10] to-transparent opacity-50" />
    </div>
  )
}



