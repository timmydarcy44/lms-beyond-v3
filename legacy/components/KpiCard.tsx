import { ReactNode } from 'react'

export default function KpiCard({ icon, label, value, hint }: { icon?: ReactNode, label: string, value: string | number, hint?: string }) {
  return (
    <div className="rounded-2xl bg-gradient-to-b from-zinc-900 to-black/60 border border-white/10 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.35)]">
      <div className="text-zinc-400 text-sm">{label}</div>
      <div className="text-4xl font-semibold tracking-tight text-white mt-1">{value}</div>
      {hint && <div className="text-zinc-500 text-xs mt-2">{hint}</div>}
      {icon && <div className="mt-3">{icon}</div>}
    </div>
  )
}
