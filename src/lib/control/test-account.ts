export function looksLikeTestDeal(input: { company_name?: string | null; email?: string | null; is_test?: boolean | null }) {
  if (input.is_test === true) return true;
  return looksLikeTestAccount({ email: input.email, name: input.company_name });
}

export function looksLikeTestAccount(input: { email?: string | null; name?: string | null; role?: string | null }) {
  const email = (input.email ?? "").trim().toLowerCase();
  const name = (input.name ?? "").trim().toLowerCase();
  if ((input.role ?? "").toLowerCase() === "demo") return true;
  if (email.includes("+test") || email.includes("+demo") || email.includes("demo@") || email.includes("test@")) return true;
  return /(^|[\s-])test([\s-]|$)/i.test(name);
}
