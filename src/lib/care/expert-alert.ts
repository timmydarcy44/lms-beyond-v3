import { getServiceRoleClient } from "@/lib/supabase/server";

export type CareExpertAlert = { id: string; title: string; message: string };

const TITLE = "Nouveau rendez-vous";

function isMissingColumn(error: { message?: string; code?: string } | null) {
  const text = String(error?.message ?? "").toLowerCase();
  return error?.code === "42703" || /column|schema cache/i.test(text);
}

export async function insertCareExpertAlert(input: { expertId: string; message: string }) {
  const db = getServiceRoleClient();
  if (!db) return;
  const payloads = [
    {
      user_id: input.expertId,
      recipient_id: input.expertId,
      type: "info",
      title: TITLE,
      message: input.message,
      payload: { title: TITLE, message: input.message, kind: "care_booking" },
      read: false,
    },
    {
      user_id: input.expertId,
      type: "info",
      title: TITLE,
      message: input.message,
      read: false,
    },
    {
      recipient_id: input.expertId,
      type: "info",
      payload: { title: TITLE, message: input.message, kind: "care_booking" },
    },
  ];
  for (const row of payloads) {
    const { error } = await db.from("notifications").insert(row);
    if (!error) return;
    if (!isMissingColumn(error)) return;
  }
}

export async function listUnreadCareExpertAlerts(userId: string): Promise<CareExpertAlert[]> {
  const db = getServiceRoleClient();
  if (!db) return [];
  const attempts = [
    () =>
      db
        .from("notifications")
        .select("id, title, message, payload, read, read_at, created_at")
        .or(`user_id.eq.${userId},recipient_id.eq.${userId}`)
        .order("created_at", { ascending: false })
        .limit(12),
    () =>
      db
        .from("notifications")
        .select("id, title, message, read, created_at")
        .eq("user_id", userId)
        .eq("read", false)
        .order("created_at", { ascending: false })
        .limit(12),
    () =>
      db
        .from("notifications")
        .select("id, payload, read_at, created_at")
        .eq("recipient_id", userId)
        .order("created_at", { ascending: false })
        .limit(12),
  ];
  for (const run of attempts) {
    const { data, error } = await run();
    if (error) {
      if (isMissingColumn(error)) continue;
      return [];
    }
    return (data ?? [])
      .map((row) => {
        const item = row as Record<string, unknown>;
        const payload = (item.payload ?? {}) as { title?: string; message?: string; kind?: string };
        const title = String(item.title ?? payload.title ?? TITLE);
        const message = String(item.message ?? payload.message ?? "");
        const unread = item.read === false || (item.read == null && !item.read_at);
        const care = /nouveau rendez-vous/i.test(title) || payload.kind === "care_booking";
        if (!unread || !care) return null;
        return { id: String(item.id), title, message };
      })
      .filter((item): item is CareExpertAlert => Boolean(item))
      .slice(0, 5);
  }
  return [];
}

export async function markCareExpertAlertRead(userId: string, id: string) {
  const db = getServiceRoleClient();
  if (!db) return;
  const now = new Date().toISOString();
  const attempts = [
    { read: true, read_at: now },
    { read: true },
    { read_at: now },
  ];
  for (const patch of attempts) {
    const { error } = await db.from("notifications").update(patch).eq("id", id).or(`user_id.eq.${userId},recipient_id.eq.${userId}`);
    if (!error) return;
    if (!isMissingColumn(error)) {
      await db.from("notifications").update(patch).eq("id", id).eq("user_id", userId);
      return;
    }
  }
}
