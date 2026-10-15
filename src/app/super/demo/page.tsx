import Link from "next/link";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { JADE_DEMO_EMAIL, JADE_DEMO_MOCK, JADE_DEMO_SPACES } from "@/lib/demo/jade-account";
import { JADE_DEMO_PASSWORD } from "@/lib/demo/jade-password";
import { ensureJadeDemoAccount } from "./actions";

export const dynamic = "force-dynamic";

export default async function SuperDemoPage() {
  const allowed = await isSuperAdmin();
  if (!allowed) {
    return <p className="p-8 text-white">Accès réservé.</p>;
  }

  const result = await ensureJadeDemoAccount();

  return (
    <div className="super-lms-light min-h-screen bg-[#F5F5F7] p-6 text-slate-900">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Compte démo</p>
      <h1 className="mt-2 text-3xl font-extrabold">Jade</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-600">{result.message}</p>
      <div className="mt-4 flex flex-wrap gap-3 text-sm">
        <span className="rounded-full bg-white px-4 py-2 font-semibold shadow-sm">{JADE_DEMO_EMAIL}</span>
        <span className="rounded-full bg-white px-4 py-2 font-semibold shadow-sm">{JADE_DEMO_PASSWORD}</span>
        <Link href="/login" className="rounded-full bg-slate-900 px-4 py-2 font-semibold text-white">
          Page de connexion
        </Link>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {JADE_DEMO_SPACES.map((space) => {
          const mock = JADE_DEMO_MOCK[space.id];
          return (
            <article key={space.id} className="rounded-3xl bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{mock.kicker}</p>
              <h2 className="mt-1 text-xl font-extrabold">{mock.title}</h2>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {mock.stats.map((stat) => (
                  <div key={stat.label}>
                    <p className="text-[11px] font-semibold uppercase text-slate-500">{stat.label}</p>
                    <p className="text-lg font-extrabold">{stat.value}</p>
                  </div>
                ))}
              </div>
              <ul className="mt-4 space-y-1 text-sm text-slate-600">
                {mock.rows.map((row) => (
                  <li key={row}>{row}</li>
                ))}
              </ul>
              <Link href={space.href} className="mt-4 inline-flex text-sm font-bold text-indigo-700">
                Ouvrir {space.label}
              </Link>
            </article>
          );
        })}
      </div>
    </div>
  );
}
