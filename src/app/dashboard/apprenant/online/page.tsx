import { redirect } from "next/navigation";
import { EDGE_LAB_ONLINE_CATALOG_HREF } from "@/lib/galaxy-branding";

/** Online → catalogue EDGE Lab directement. */
export default function ApprenantOnlinePage() {
  redirect(EDGE_LAB_ONLINE_CATALOG_HREF);
}
