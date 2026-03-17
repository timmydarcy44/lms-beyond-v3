import { redirect } from "next/navigation";

export default function AppLibraryRedirect() {
  const isNevo = process.env.NEXT_PUBLIC_SITE_URL?.includes("nevo");
  redirect(isNevo ? "/note-app" : "/library");
}
