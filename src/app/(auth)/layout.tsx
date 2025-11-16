import type { Metadata } from "next";
import { AuthLayoutShell } from "./auth-layout-shell";

export const metadata: Metadata = {
  title: "LMS | Authentification",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthLayoutShell>{children}</AuthLayoutShell>;
}




