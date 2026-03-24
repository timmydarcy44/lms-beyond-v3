import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "LMS | Authentification",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}




