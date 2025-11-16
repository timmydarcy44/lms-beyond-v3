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


