'use client'
import { ReactNode, useRef } from 'react'

export default function HScroll({ children, title }: { children: ReactNode, title: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const scrollBy = (delta: number) => ref.current?.scrollBy({ left: delta, behavior: 'smooth' })
  return (
    <section className="mt-10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white/90">{title}</h3>
        <div className="flex gap-2">
          <button onClick={() => scrollBy(-500)} className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10">◀</button>
          <button onClick={() => scrollBy(500)} className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10">▶</button>
        </div>
      </div>
      <div ref={ref} className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory">
        {children}
      </div>
    </section>
  )
}



