import { notFound } from "next/navigation";
import { getJessicaQuestionnaire } from "@/lib/jessica-contentin/questionnaires";
import { resolveJessicaQuestionnaire } from "@/lib/queries/jessica-questionnaires";
import { JessicaTypeformPlayer } from "@/components/jessica-contentin/jessica-typeform-player";

export const revalidate = 0;

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string }>;
};

export default async function PublicJessicaQuestionnairePage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { preview } = await searchParams;
  const questionnaire =
    (await resolveJessicaQuestionnaire(slug)) ?? getJessicaQuestionnaire(slug);
  if (!questionnaire) notFound();
  if ("is_active" in questionnaire && (questionnaire as { is_active?: boolean }).is_active === false) {
    notFound();
  }

  return (
    <JessicaTypeformPlayer
      questionnaire={questionnaire}
      preview={preview === "1" || preview === "true"}
    />
  );
}
