import { describe, expect, it } from "vitest";
import { careBookingInputSchema, resolveCareBookingDomain } from "../booking-schema";
import { buildCareBookingIcs } from "../ics";
import { canCancelCareBooking } from "../load-booking";

const base = {
  slug: "lea-martin",
  serviceId: "11111111-1111-4111-8111-111111111111",
  start: "2026-11-10T09:00:00.000Z",
  format: "visio" as const,
  forWhom: "self" as const,
  domain: "emotions",
  firstName: "Ada",
  lastName: "Lovelace",
  email: "ada@example.com",
  phone: "0612345678",
  consent: true,
  paymentMethod: "on_site" as const,
};

describe("careBookingInputSchema", () => {
  it("accepts a complete self booking", () => {
    expect(careBookingInputSchema.parse(base).email).toBe("ada@example.com");
  });

  it("requires child fields and rejects card payments", () => {
    const child = careBookingInputSchema.safeParse({ ...base, forWhom: "child" });
    expect(child.success).toBe(false);
    const card = careBookingInputSchema.safeParse({ ...base, paymentMethod: "card" });
    expect(card.success).toBe(false);
  });

  it("maps unknown domain to the service domain", () => {
    expect(resolveCareBookingDomain("unknown", "famille")).toBe("famille");
  });
});

describe("care booking helpers", () => {
  it("builds an ics event", () => {
    const ics = buildCareBookingIcs({
      id: "abc",
      title: "Bilan",
      startsAt: new Date("2026-11-10T09:00:00.000Z"),
      endsAt: new Date("2026-11-10T10:00:00.000Z"),
      location: "Visio",
      description: "RDV",
    });
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("SUMMARY:Bilan");
  });

  it("blocks cancellation inside the notice window", () => {
    const now = new Date("2026-11-10T08:00:00.000Z");
    expect(canCancelCareBooking("2026-11-10T09:00:00.000Z", 24, now)).toBe(false);
    expect(canCancelCareBooking("2026-11-12T09:00:00.000Z", 24, now)).toBe(true);
  });
});
