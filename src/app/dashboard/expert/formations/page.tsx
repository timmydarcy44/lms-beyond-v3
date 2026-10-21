import { EmptyState, ExpertPageFrame, ExpertPageHeader, ExpertPrimaryButton } from "@/components/expert/expert-ui";
import { loadExpertShopFormations } from "@/lib/expert/shop-formations";

export const dynamic = "force-dynamic";

export default async function ExpertFormationsPage() {
  const courses = await loadExpertShopFormations();

  return (
    <ExpertPageFrame>
      <ExpertPageHeader title="Formations" subtitle="Formations Byound proposées à l'achat." />
      {courses.length === 0 ? (
        <EmptyState title="Aucune formation en vente" text="Les formations publiées pour l'espace expert apparaîtront ici." />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {courses.map((course) => (
            <li key={course.id} className="flex flex-col rounded-[28px] bg-[#12141A] p-6">
              <p className="text-2xl font-extrabold tracking-[-0.03em] text-[#F4F5F7]">{course.title}</p>
              {course.subtitle ? <p className="mt-2 text-sm text-[#B5BAC6]">{course.subtitle}</p> : null}
              <p className="mt-5 text-4xl font-extrabold tracking-[-0.04em] text-[#FF4B4B]">{course.price}</p>
              {course.href ? (
                <div className="mt-6">
                  <ExpertPrimaryButton href={course.href}>Voir la formation</ExpertPrimaryButton>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </ExpertPageFrame>
  );
}
