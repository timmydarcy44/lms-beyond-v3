import { redirect } from "next/navigation";

/** Ancienne route Défi EDGE → Mission EDGE */
export default async function DefiRedirectPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") qs.set(key, value);
    else if (Array.isArray(value)) value.forEach((v) => qs.append(key, v));
  }
  const query = qs.toString();
  redirect(`/dashboard/apprenant/mission${query ? `?${query}` : ""}`);
}
