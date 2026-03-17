import { redirect } from "next/navigation";

export default function AppLibraryRedirect() {
  redirect("/beyond-note-app?view=library");
}
