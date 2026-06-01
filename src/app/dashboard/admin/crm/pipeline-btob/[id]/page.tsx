import { redirect } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export default async function AdminPipelineBtobDealAlias({ params }: Props) {
  const { id } = await params;
  redirect(`/super/crm/pipeline-btob/${id}`);
}
