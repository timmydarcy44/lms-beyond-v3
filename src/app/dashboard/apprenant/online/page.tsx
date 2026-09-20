import { redirect } from "next/navigation";
import { EDGE_ONLINE_APP_SURFACE_PATH } from "@/lib/galaxy-branding";

/** Online → surface EDGE Online (/edgeonline). */
export default function ApprenantOnlinePage() {
  redirect(EDGE_ONLINE_APP_SURFACE_PATH);
}
