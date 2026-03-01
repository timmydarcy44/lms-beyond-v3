const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as
  | string
  | undefined;
// Charger la clé service role - vérifier plusieurs variantes possibles
const supabaseServiceKey = (
  process.env.SUPABASE_SERVICE_ROLE_KEY || 
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
) as string | undefined;

// Debug: vérifier si la configuration d'environnement est chargée (dev uniquement)
if (typeof window === "undefined" && process.env.NODE_ENV !== "production") {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY === "") {
    console.warn("[env] SUPABASE_SERVICE_ROLE_KEY is defined but empty in process.env");
  }
}

const brevoApiKey = process.env.BREVO_API_KEY as string | undefined;
const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string | undefined;

// Debug: vérifier si BREVO_API_KEY est chargée (dev uniquement)
if (typeof window === "undefined" && process.env.NODE_ENV !== "production") {
  if (process.env.BREVO_API_KEY === "") {
    console.warn("[env] BREVO_API_KEY is defined but empty in process.env");
  }
}

export const env = {
  supabaseUrl,
  supabaseAnonKey,
  supabaseServiceKey,
  brevoApiKey,
  stripePublishableKey,
};


