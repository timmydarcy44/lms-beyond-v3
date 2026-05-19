import { redirect } from "next/navigation";

/** Ancienne URL — redirection vers /edge-online */
export default function EdgeOnlineLegacyRedirect() {
  redirect("/edge-lab/edge-online");
}
