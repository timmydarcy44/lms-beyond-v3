/**
 * Client-safe hook après save test — n'importe pas de modules serveur.
 * Navigateur : POST /api/learner/cross-profile/trigger
 * Serveur (API routes) : import dynamique de maybeTriggerCrossProfileCompletion
 */
export async function notifyCrossProfileCompletion(userId: string): Promise<void> {
  const uid = userId.trim();
  if (!uid) return;

  if (typeof window !== "undefined") {
    void fetch("/api/learner/cross-profile/trigger", {
      method: "POST",
      credentials: "include",
    }).catch((err) => {
      console.warn("[cross-profile] trigger fetch:", err);
    });
    return;
  }

  const { maybeTriggerCrossProfileCompletion } = await import(
    "@/lib/learner/cross-profile-completion"
  );
  void maybeTriggerCrossProfileCompletion(uid).catch((err) => {
    console.warn("[cross-profile] trigger:", err);
  });
}
