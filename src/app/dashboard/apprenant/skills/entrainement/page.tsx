import { redirect } from "next/navigation";
import { SKILLS_TRAINING_ENABLED } from "@/lib/apprenant/skills-training-flag";
import SkillsEntrainementPage from "./entrainement-client";

export default function EntrainementRoute() {
  if (!SKILLS_TRAINING_ENABLED) {
    redirect("/dashboard/apprenant/skills");
  }
  return <SkillsEntrainementPage />;
}
