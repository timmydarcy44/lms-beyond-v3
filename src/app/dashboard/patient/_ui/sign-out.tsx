"use client";

import { useRouter } from "next/navigation";
import { useSupabase } from "@/components/providers/supabase-provider";

export function PatientSignOut() {
  const router = useRouter();
  const supabase = useSupabase();

  return (
    <button
      type="button"
      className="patient-pill patient-pill--dark"
      onClick={() => {
        void supabase.auth.signOut().then(() => router.push("/care"));
      }}
    >
      Déconnexion
    </button>
  );
}
