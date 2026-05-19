"use client";

import { useEffect } from "react";

export default function RegisterExpertRedirectPage() {
  useEffect(() => {
    window.location.href = "/expert/register";
  }, []);

  return null;
}

