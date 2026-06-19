/**
 * Client-only hook après save test — aucun import serveur, aucun import dynamique.
 * Les API routes serveur doivent appeler maybeTriggerCrossProfileCompletion directement.
 */
export function notifyCrossProfileCompletion(_userId: string): void {
  if (typeof window === "undefined") return;

  void fetch("/api/learner/cross-profile/trigger", {
    method: "POST",
    credentials: "include",
  }).catch((err) => {
    console.warn("[cross-profile] trigger fetch:", err);
  });
}
