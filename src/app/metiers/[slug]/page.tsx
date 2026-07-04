import Link from "next/link";
import { notFound } from "next/navigation";
import { getCareerProfileBySlug, listCareerProfiles } from "@/lib/career-profiles/career-profiles-repo";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const profiles = await listCareerProfiles();
  return profiles.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const career = await getCareerProfileBySlug(slug);
  if (!career) return { title: "Métier — EDGE" };
  return {
    title: `${career.title} — EDGE`,
    description: career.description,
  };
}

export default async function MetierPage({ params }: Props) {
  const { slug } = await params;
  const career = await getCareerProfileBySlug(slug);
  if (!career) notFound();

  return (
    <div className="min-h-screen bg-[#F7F7F5] text-[#050505]">
      <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
        <Link href="/particuliers" className="text-sm text-[#050505]/50 hover:text-[#050505]">
          ← EDGE Particulier
        </Link>
        <p className="mt-8 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#635BFF]">
          {career.sector}
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">{career.title}</h1>
        <p className="mt-4 text-base leading-relaxed text-[#050505]/70">{career.description}</p>

        <section className="mt-10 space-y-8">
          <div>
            <h2 className="text-lg font-semibold">Missions principales</h2>
            <ul className="mt-3 space-y-2">
              {career.main_missions.map((m) => (
                <li key={m} className="text-sm text-[#050505]/70">
                  · {m}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold">Hard skills</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {career.key_skills.map((s) => (
                <span key={s} className="rounded-full border border-[#050505]/10 bg-white px-3 py-1 text-xs font-medium">
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold">Soft skills</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {career.soft_skills.map((s) => (
                <span
                  key={s}
                  className="rounded-full border border-[#635BFF]/15 bg-[#635BFF]/5 px-3 py-1 text-xs font-medium text-[#635BFF]"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold">Qualités utiles</h2>
            <ul className="mt-3 space-y-1">
              {career.useful_qualities.map((q) => (
                <li key={q} className="text-sm text-[#050505]/70">
                  · {q}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold">Difficultés fréquentes</h2>
            <ul className="mt-3 space-y-1">
              {career.typical_challenges.map((c) => (
                <li key={c} className="text-sm text-[#050505]/70">
                  · {c}
                </li>
              ))}
            </ul>
          </div>

          {career.recommended_badges.length ? (
            <div>
              <h2 className="text-lg font-semibold">Badges utiles</h2>
              <ul className="mt-3 space-y-1">
                {career.recommended_badges.map((b) => (
                  <li key={b} className="text-sm text-[#050505]/70">
                    · {b}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="rounded-2xl border border-[#635BFF]/15 bg-[#635BFF]/5 p-6">
            <h2 className="text-lg font-semibold">Analyse avec le Profil EDGE</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#050505]/65">
              Passez les 3 explorations EDGE et sélectionnez ce métier dans votre Profil pour obtenir une estimation de
              cohérence, vos forces et vos axes de progression — sans contenu fictif ni promesse commerciale.
            </p>
            <Link
              href="/particuliers"
              className="mt-4 inline-flex rounded-xl bg-[#050505] px-5 py-3 text-sm font-semibold text-white"
            >
              Découvrir EDGE Particulier
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
