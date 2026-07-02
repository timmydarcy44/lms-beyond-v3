"use client";

import { useEffect } from "react";

/** Redirige vers le parcours d'inscription expert existant. */
export default function SignupExpertRedirectPage() {
  useEffect(() => {
    window.location.href = "/expert/register";
  }, []);

  return null;
}
