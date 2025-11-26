const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as
  | string
  | undefined;
// Charger la clé service role - vérifier plusieurs variantes possibles
const supabaseServiceKey = (
  process.env.SUPABASE_SERVICE_ROLE_KEY || 
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
) as string | undefined;

// Debug: vérifier si la clé service role est chargée
if (typeof window === 'undefined') {
  // Côté serveur uniquement
  console.log("[env] SUPABASE_SERVICE_ROLE_KEY exists:", !!supabaseServiceKey);
  console.log("[env] SUPABASE_SERVICE_ROLE_KEY length:", supabaseServiceKey?.length || 0);
  console.log("[env] SUPABASE_SERVICE_ROLE_KEY from process.env:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);
  console.log("[env] SUPABASE_SERVICE_ROLE_KEY process.env length:", process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0);
  
  // Vérifier si la variable est définie mais vide
  if (process.env.SUPABASE_SERVICE_ROLE_KEY === '') {
    console.warn("[env] SUPABASE_SERVICE_ROLE_KEY is defined but empty in process.env");
  }
}

const brevoApiKey = process.env.BREVO_API_KEY as string | undefined;
const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string | undefined;

// Debug: vérifier si BREVO_API_KEY est chargée
if (typeof window === 'undefined') {
  // Côté serveur uniquement
  console.log("[env] BREVO_API_KEY exists:", !!brevoApiKey);
  console.log("[env] BREVO_API_KEY length:", brevoApiKey?.length || 0);
  console.log("[env] BREVO_API_KEY from process.env:", !!process.env.BREVO_API_KEY);
  console.log("[env] BREVO_API_KEY process.env length:", process.env.BREVO_API_KEY?.length || 0);
  
  // Vérifier si la variable est définie mais vide
  if (process.env.BREVO_API_KEY === '') {
    console.warn("[env] BREVO_API_KEY is defined but empty in process.env");
  }
  
  // Afficher les premières lettres pour vérifier (sans exposer la clé complète)
  if (process.env.BREVO_API_KEY) {
    console.log("[env] BREVO_API_KEY starts with:", process.env.BREVO_API_KEY.substring(0, 10));
  }
}

export const env = {
  supabaseUrl,
  supabaseAnonKey,
  supabaseServiceKey,
  brevoApiKey,
  stripePublishableKey,
};


