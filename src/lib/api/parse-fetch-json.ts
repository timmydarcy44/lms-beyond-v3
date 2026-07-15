/** Parse une réponse fetch en JSON sans planter sur un corps vide. */
export async function parseFetchJson<T extends Record<string, unknown> = Record<string, unknown>>(
  res: Response,
): Promise<T> {
  const text = await res.text();
  if (!text.trim()) {
    if (!res.ok) {
      throw new Error(`Erreur serveur (${res.status})`);
    }
    return {} as T;
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(res.ok ? "Réponse serveur invalide" : `Erreur serveur (${res.status})`);
  }
}
