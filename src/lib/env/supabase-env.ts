export type SupabaseDiagnostics = {
  hasSupabaseUrl: boolean;
  hasServiceRoleKey: boolean;
  supabaseUrlLooksValid: boolean;
  hasLegacyServiceRoleKeyName: boolean;
};

const isDevEnvironment =
  typeof process !== "undefined" && process.env.NODE_ENV !== "production";

let legacyWarningEmitted = false;

const PRIMARY_SERVICE_ROLE_KEY = "SUPABASE_SERVICE_ROLE_KEY";
const LEGACY_SERVICE_ROLE_KEY = "SUPABASE_SERVICE_ROLE_KEY";

export const getRawEnv = (key: string): string | null => {
  const value = process.env[key];
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export const getSupabaseUrl = (): string | null => {
  const primary = getRawEnv("SUPABASE_URL");
  if (primary) {
    return primary;
  }
  return getRawEnv("NEXT_PUBLIC_SUPABASE_URL");
};

export const getServiceRoleKey = (): string | null => {
  const value = getRawEnv(PRIMARY_SERVICE_ROLE_KEY);
  const legacy = getRawEnv(LEGACY_SERVICE_ROLE_KEY);

  if (!legacyWarningEmitted && legacy && isDevEnvironment) {
    console.warn(
      "[supabase-env] Detected legacy env var SUPABASE_SERVICE_ROLE_KEY. Rename it to SUPABASE_SERVICE_ROLE_KEY.",
    );
    legacyWarningEmitted = true;
  }

  return value;
};

export const getServiceRoleKeyPresent = (): boolean => {
  return getServiceRoleKey() !== null;
};

export const hasLegacyServiceRoleKeyName = (): boolean => {
  return getRawEnv(LEGACY_SERVICE_ROLE_KEY) !== null;
};

export const looksLikeSupabaseUrl = (url: string | null): boolean => {
  if (!url) {
    return false;
  }
  if (url.trim().length !== url.length) {
    return false;
  }
  return /^https:\/\/.+\.supabase\.co\/?$/.test(url);
};

export const getSupabaseEnvDiagnostics = (): SupabaseDiagnostics => {
  const supabaseUrl = getSupabaseUrl();
  return {
    hasSupabaseUrl: supabaseUrl !== null,
    hasServiceRoleKey: getServiceRoleKeyPresent(),
    supabaseUrlLooksValid: looksLikeSupabaseUrl(supabaseUrl),
    hasLegacyServiceRoleKeyName: hasLegacyServiceRoleKeyName(),
  };
};

