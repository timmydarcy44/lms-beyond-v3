import { FormateurFormationBuilderWhite } from "@/app/dashboard/formateur/formations/new/page";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <FormateurFormationBuilderWhite initialCourseId={id} />;
}

