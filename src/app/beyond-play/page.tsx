import { Metadata } from "next";
import { BeyondPlayPage } from "@/components/beyond-play/beyond-play-page";

export const metadata: Metadata = {
  title: "Beyond Play - Gamification et apprentissage | Beyond",
  description: "Apprenez en vous amusant grâce à Beyond Play. Transformez votre parcours de formation en expérience ludique et engageante.",
};

export default function PlayPage() {
  return <BeyondPlayPage />;
}

