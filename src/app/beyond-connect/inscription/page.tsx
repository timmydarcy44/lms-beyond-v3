import { Metadata } from "next";
import { CandidateSignupPage } from "@/components/beyond-connect/candidate-signup-page";

export const metadata: Metadata = {
  title: "Inscription - Beyond Connect",
  description: "Créez votre compte Beyond Connect en quelques secondes",
};

export default function CandidateSignupRoute() {
  return <CandidateSignupPage />;
}

