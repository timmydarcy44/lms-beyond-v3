import { cn } from "@/lib/utils";

export function PageWrap({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
      </header>
      {children}
    </div>
  );
}

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("rounded-xl border border-white/10 bg-white/[0.04] p-4 sm:p-5", className)}>{children}</div>
  );
}

export function KpiCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-2 text-xl font-bold sm:text-2xl">{value}</p>
    </Card>
  );
}
