export const UserRole = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  EVALUATOR: "EVALUATOR",
  EARNER: "EARNER",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

