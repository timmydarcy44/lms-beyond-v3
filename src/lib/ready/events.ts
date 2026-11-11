import type { SupabaseClient } from "@supabase/supabase-js";
import type { ReadyEventType } from "@/lib/ready/constants";

export async function logReadyEvent(
  service: SupabaseClient,
  linkId: string,
  eventType: ReadyEventType,
  meta: Record<string, unknown> = {},
): Promise<void> {
  const { error } = await service.from("ready_events").insert({
    link_id: linkId,
    event_type: eventType,
    meta,
  });
  if (error) {
    console.warn("[ready] event log:", error.message);
  }
}
