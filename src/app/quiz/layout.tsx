import { JessicaContentinLayout } from "@/app/jessica-contentin/layout";

export default function QuizLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Ne pas afficher le header et footer pour le quiz (design fullscreen comme Tony Robbins)
  return <div className="min-h-screen bg-[#F8F5F0]">{children}</div>;
}

