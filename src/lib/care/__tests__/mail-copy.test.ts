import { describe, expect, it } from "vitest";
import { appointmentCard, cancellationRuleLabel, type CareMailInput } from "../mail-copy";

const base: CareMailInput = {
  id: "1",
  accessToken: "token",
  startsAt: "2026-10-29T10:00:00.000Z",
  endsAt: "2026-10-29T11:00:00.000Z",
  place: "cabinet",
  serviceName: "Séance",
  durationMin: 60,
  clientFirstName: "Jennifer",
  clientEmail: "jennifer@example.com",
  practitionerName: "Timmy Darcy",
  practitionerTitle: "Professeur",
  practitionerEmail: "timmy@example.com",
  practitionerAvatarUrl: null,
  practitionerSlug: "timmy",
  address: "14 rue Example",
  city: "Caen",
  cancellationHours: 24,
  noFee: true,
};

describe("care mail copy", () => {
  it("n'affiche pas le libellé interne Moi", () => {
    const card = appointmentCard(base, "default");
    expect(card.placeTitle).toBe("Cabinet de Timmy Darcy");
    expect(JSON.stringify(card)).not.toContain("Moi");
  });

  it("lit le délai d'annulation", () => {
    expect(cancellationRuleLabel(48)).toBe("Modification ou annulation gratuite jusqu'à 48 h avant.");
  });
});
