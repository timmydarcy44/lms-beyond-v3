export function parseClientName(fullName: string | null | undefined): {
  firstName: string | null;
  lastName: string | null;
} {
  const trimmed = fullName?.trim();
  if (!trimmed) return { firstName: null, lastName: null };
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: null };
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

export function formatClientName(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  fallback = "Client sans nom",
): string {
  const name = [firstName, lastName].filter(Boolean).join(" ").trim();
  return name || fallback;
}
