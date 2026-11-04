import Link from "next/link";

import { ExpertProjectPdfButton } from "@/components/apprenant/expert-project-pdf-button";
import { APPRENANT_PAGE_LEAD, APPRENANT_PAGE_SHELL, APPRENANT_PAGE_TITLE } from "@/lib/apprenant/connect-nav";
import { loadExpertProject, type ExpertProjectWorkshop } from "@/lib/workshops/learner-project";

export const dynamic = "force-dynamic";

function formatDay(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function WorkshopCard({ workshop }: { workshop: ExpertProjectWorkshop }) {
  if (!workshop.validated) {
    return (
      <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-white/45 sm:p-5">
        <p className="text-sm">{workshop.chapterTitle}</p>
        <h3 className="mt-1 text-base font-semibold">{workshop.title}</h3>
        <Link href={workshop.href} className="mt-3 inline-flex min-h-11 items-center font-semibold text-[#C4B5FD]">
          Faire l'atelier
        </Link>
      </article>
    );
  }

  return (
    <article className="rounded-2xl border border-white/10 bg-[#17171F] p-4 text-white sm:p-5">
      <p className="text-sm text-white/45">{workshop.chapterTitle}</p>
      <h3 className="mt-1 text-base font-semibold">{workshop.title}</h3>
      {workshop.validatedAt ? <p className="mt-1 text-sm text-white/55">Validé le {formatDay(workshop.validatedAt)}</p> : null}
      {workshop.answers.length > 0 ? (
        <dl className="mt-4 space-y-3">
          {workshop.answers.map((answer, index) => (
            <div key={`${workshop.id}-${index}`}>
              <dt className="text-sm font-semibold text-white/55">{answer.label}</dt>
              <dd className="mt-1 whitespace-pre-wrap text-base leading-relaxed">{answer.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {workshop.feedback ? (
        <details className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <summary className="cursor-pointer text-sm font-semibold">Dernier retour</summary>
          <div className="mt-3 space-y-3">
            {workshop.feedback.criteres.map((item, index) => (
              <div key={`${item.critere}-${index}`}>
                <p className="font-semibold">
                  {item.critere}{" "}
                  <span className={item.statut === "reussi" ? "text-[#2FD08A]" : "text-[#E4A84A]"}>
                    {item.statut === "reussi" ? "Réussi" : "À améliorer"}
                  </span>
                </p>
                {item.commentaire ? <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-white/75">{item.commentaire}</p> : null}
                {item.suggestion ? <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-white/75">Suggestion. {item.suggestion}</p> : null}
              </div>
            ))}
            {workshop.feedback.commentaire_global ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/75">{workshop.feedback.commentaire_global}</p>
            ) : null}
          </div>
        </details>
      ) : null}
    </article>
  );
}

export default async function MonProjetExpertPage() {
  const project = await loadExpertProject();
  const courses = project?.courses ?? [];
  const validated = project?.validated ?? 0;
  const total = project?.total ?? 0;
  const progress =
    total === 0
      ? "Aucun atelier pour le moment."
      : `${validated} atelier${validated > 1 ? "s" : ""} validé${validated > 1 ? "s" : ""} sur ${total}`;

  return (
    <div className={APPRENANT_PAGE_SHELL}>
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h1 className={APPRENANT_PAGE_TITLE}>Mon projet expert</h1>
          <p className={APPRENANT_PAGE_LEAD}>{progress}</p>
        </div>
        {total > 0 ? <ExpertProjectPdfButton courses={courses} /> : null}
      </section>

      {courses.length === 0 ? (
        <p className="text-sm text-white/55">Vos ateliers validés apparaîtront ici, formation par formation.</p>
      ) : (
        <div className="space-y-8">
          {courses.map((course) => {
            const done = course.workshops.filter((item) => item.validated).length;
            return (
              <section key={course.id} className="space-y-3">
                <div>
                  <h2 className="text-lg font-semibold text-white">{course.title}</h2>
                  <p className="text-sm text-white/45">
                    {done} sur {course.workshops.length}
                  </p>
                </div>
                <div className="space-y-3">
                  {course.workshops.map((workshop) => (
                    <WorkshopCard key={workshop.id} workshop={workshop} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
