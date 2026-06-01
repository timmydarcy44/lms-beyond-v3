export function formatDateFr(date: string, opts?: Intl.DateTimeFormatOptions) {
  return new Date(date).toLocaleDateString("fr-FR", opts ?? {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function formatTime(t: string) {
  return String(t).slice(0, 5);
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function weekRange(date = new Date()) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7;
  const monday = new Date(d);
  monday.setDate(d.getDate() - day);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    from: monday.toISOString().slice(0, 10),
    to: sunday.toISOString().slice(0, 10),
  };
}

export function nextFridayLabel() {
  const now = new Date();
  const day = now.getDay();
  const daysUntil = day === 5 ? 0 : (5 - day + 7) % 7 || 7;
  const friday = new Date(now);
  friday.setDate(now.getDate() + daysUntil);
  return friday.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}

export function monthBounds(year: number, month: number) {
  const from = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const last = new Date(year, month + 1, 0).getDate();
  const to = `${year}-${String(month + 1).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
  return { from, to };
}

export function collabFirstName(profiles?: { first_name?: string; full_name?: string } | null) {
  if (!profiles) return "Collaborateur";
  return profiles.first_name || profiles.full_name?.split(" ")[0] || "Collaborateur";
}

export async function startStripeOnboarding(): Promise<void> {
  const res = await fetch("/api/marketplace/praticien/stripe-onboarding", { method: "POST" });
  const json = (await res.json()) as { url?: string; error?: string };
  if (!res.ok || !json.url) throw new Error(json.error ?? `Erreur Stripe (${res.status})`);
  window.location.href = json.url;
}
