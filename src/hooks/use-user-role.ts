"use client";

import { useQuery } from "@tanstack/react-query";
import { useContext } from "react";
import { SupabaseContext } from "@/components/providers/supabase-provider";
import type { UserRole } from "@/types/database";
import { useEffect, useState } from "react";

interface UseUserRoleOptions {
  enabled?: boolean;
}

export const useUserRole = (options?: UseUserRoleOptions) => {
  const [isMounted, setIsMounted] = useState(false);
  // Utiliser useContext directement au lieu de useSupabase pour éviter l'erreur
  const context = useContext(SupabaseContext);
  const supabase = context?.supabase ?? null;
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  return useQuery({
    queryKey: ["user", "role"],
    queryFn: async (): Promise<UserRole | null> => {
      // Si le provider n'est pas disponible ou pas encore monté, retourner null
      if (!isMounted || !supabase) {
        return null;
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        return null;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (error) {
        throw error;
      }

      return data?.role ?? null;
    },
    staleTime: 5 * 60 * 1000,
    enabled: (options?.enabled ?? true) && isMounted && !!supabase,
  });
};





