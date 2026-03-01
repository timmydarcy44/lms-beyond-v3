import { Metadata } from "next";
import { LMSPresentationPage } from "@/components/beyond-center/lms-presentation-page";

export const metadata: Metadata = {
  title: "Beyond LMS - Plateforme d'apprentissage intelligente | Beyond Center",
  description: "Découvrez Beyond LMS, la plateforme d'apprentissage complète pour créer, distribuer et animer des expériences pédagogiques. Builder modulaire, IA intégrée, suivi en temps réel et bien plus.",
};

export default function LMSPresentationRoute() {
  return <LMSPresentationPage />;
}

