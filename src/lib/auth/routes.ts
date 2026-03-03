export const AUTH_ROUTES = {
  login: "/login",
  signup: "/signup",
  logout: "/logout",
  unauthorized: "/unauthorized",
} as const;

export const DASHBOARD_ROUTES = {
  formateur: "/dashboard/formateur",
  apprenant: "/dashboard/apprenant",
  admin: "/admin",
  tuteur: "/dashboard/tuteur",
} as const;

export const PROTECTED_ROUTES = [
  DASHBOARD_ROUTES.formateur,
  DASHBOARD_ROUTES.apprenant,
  DASHBOARD_ROUTES.admin,
  DASHBOARD_ROUTES.tuteur,
] as const;


