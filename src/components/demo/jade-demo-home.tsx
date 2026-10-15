import Link from "next/link";
import { JADE_DEMO_MOCK, JADE_DEMO_SPACES, type JadeDemoSpace } from "@/lib/demo/jade-account";

export function JadeDemoHome({ space }: { space: JadeDemoSpace }) {
  const mock = JADE_DEMO_MOCK[space];
  return (
    <div className="min-h-screen bg-[#07080B] px-6 py-8 text-[#F4F5F7]">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9096A3]">{mock.kicker}</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight">{mock.title}</h1>
      <p className="mt-2 text-sm text-[#B5BAC6]">Compte démo Jade · données d&apos;exemple</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {mock.stats.map((stat) => (
          <article key={stat.label} className="rounded-2xl border border-[#262A36] bg-[#12141A] p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-[#9096A3]">{stat.label}</p>
            <p className="mt-2 text-2xl font-extrabold">{stat.value}</p>
          </article>
        ))}
      </div>
      <ul className="mt-6 space-y-2">
        {mock.rows.map((row) => (
          <li key={row} className="rounded-2xl border border-[#262A36] bg-[#171922] px-4 py-3 text-sm">
            {row}
          </li>
        ))}
      </ul>
      <div className="mt-8 flex flex-wrap gap-2">
        {JADE_DEMO_SPACES.map((item) => (
          <Link key={item.id} href={item.href} className="rounded-full border border-[#262A36] px-3 py-2 text-xs font-bold text-[#F4F5F7]">
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
