import { redirect } from "next/navigation";
import { EDGE_ONLINE_EXTERNAL_URL } from "@/lib/training-courses/types";

export default function ExpertEdgeOnlinePage() {
  redirect(EDGE_ONLINE_EXTERNAL_URL);
}
