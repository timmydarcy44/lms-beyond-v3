export const EXPERT_POLE_COOKIE = "expert_pole";

export type ExpertPole = "formation" | "care";
export type MembershipStatus = "active" | "pending" | "suspended";

export type ExpertMembership = {
  pole: ExpertPole;
  status: MembershipStatus;
};

export type ExpertPoleState = {
  ready: boolean;
  pole: ExpertPole;
  memberships: ExpertMembership[];
  managerPoles: ExpertPole[];
};

export function activePoles(memberships: ExpertMembership[]): ExpertPole[] {
  return memberships.filter((item) => item.status === "active").map((item) => item.pole);
}

export function resolveActivePole(memberships: ExpertMembership[], cookie: ExpertPole | null): ExpertPole {
  const active = activePoles(memberships);
  if (cookie && active.includes(cookie)) return cookie;
  if (active.length === 1) return active[0];
  if (active.includes("formation")) return "formation";
  return active[0] ?? "formation";
}
