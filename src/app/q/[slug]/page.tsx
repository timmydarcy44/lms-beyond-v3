import { notFound } from "next/navigation";
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
  const questionnaire = await resolveJessicaQuestionnaire(slug);
  if (!questionnaire || ("is_active" in questionnaire && questionnaire.is_active === false)) {
    notFound();
  }

  return (
    <JessicaTypeformPlayer
      questionnaire={questionnaire}
      preview={preview === "1" || preview === "true"}
    />
  );
}
