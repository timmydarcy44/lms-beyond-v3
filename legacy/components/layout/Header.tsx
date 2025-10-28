import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export default async function Header() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  
  let firstName = "👋";
  
  if (user) {
    // Essayer de récupérer le prénom depuis profiles
    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name")
      .eq("id", user.id)
      .single();
    
    if (profile?.first_name?.trim()) {
      firstName = profile.first_name.trim();
    } else if (user.user_metadata?.first_name?.trim()) {
      // Fallback sur user_metadata
      firstName = user.user_metadata.first_name.trim();
    } else if (user.email) {
      // Fallback sur la partie avant @ de l'email
      firstName = user.email.split("@")[0];
    }
  }
  
  return (
    <header className="h-14 flex items-center px-6 border-b border-white/5 bg-[#0A0F1A]">
      <h1 className="text-2xl font-semibold text-white">
        Bonjour {firstName} 👋
      </h1>
    </header>
  );
}