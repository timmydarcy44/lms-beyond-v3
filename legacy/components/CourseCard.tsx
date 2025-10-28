import Image from 'next/image'
import Link from 'next/link'

export default function CourseCard({ id, title, coverUrl }: { id: string, title: string, coverUrl?: string | null }) {
  return (
    <Link href={`/courses/${id}`} className="snap-start shrink-0 w-[280px] group">
      <div className="relative h-[160px] w-full rounded-2xl overflow-hidden border border-white/5 bg-white/[0.04]">
        {coverUrl ? (
          <Image src={coverUrl} alt={title} fill className="object-cover group-hover:scale-[1.02] transition-transform" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-indigo-500/30 to-fuchsia-600/30" />
        )}
      </div>
      <div className="mt-3 text-white/90 font-medium line-clamp-2">{title}</div>
    </Link>
  )
}



