import { Fraunces, Inter } from "next/font/google";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

/** Lecteur formation Jessica — sans menu ni footer du site vitrine. */
export default function FormationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`min-h-screen bg-[#F8F5F0] ${fraunces.variable} ${inter.variable}`}>
      {children}
    </div>
  );
}
