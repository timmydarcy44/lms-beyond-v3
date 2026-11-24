/** Ouvre l’espace entreprise d’un compte client en lecture (accompagnement staff). */
export async function startClientView(orgId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const response = await fetch("/api/super/impersonation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orgId, mode: "read", reasonCode: "client_request" }),
  });
  const json = (await response.json().catch(() => ({}))) as { error?: string };
  if (!response.ok) {
    return { ok: false, error: json.error || "Ouverture impossible" };
  }
  return { ok: true };
}
