import { revalidatePath, revalidateTag } from "next/cache";

export function revalidateCarePublicProfile(slug: string) {
  const path = slug.trim();
  if (path) revalidatePath(`/care/praticiens/${path}`);
  revalidatePath("/care/praticiens");
  revalidatePath("/care");
  revalidateTag("care-slots");
}
