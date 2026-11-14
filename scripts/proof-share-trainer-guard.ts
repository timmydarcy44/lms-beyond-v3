import { selectAccommodationsForTrainerShare } from "../src/lib/handicap/share-trainer-guard";

const payload = [
  {
    id: "acc-1",
    category: "supports" as const,
    label: "Temps supplémentaire",
    details: "Justificatif RQTH à présenter en session",
  },
];

const result = selectAccommodationsForTrainerShare(payload, {});
console.log("--- Preuve module share-trainer-guard.ts ---");
console.log(JSON.stringify(result, null, 2));
if (result.error !== "Reformulez en décrivant le besoin, sans mention du handicap.") {
  process.exit(1);
}
console.log("OK: envoi refusé à cause de « RQTH ».");
