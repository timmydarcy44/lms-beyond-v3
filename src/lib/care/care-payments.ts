/** Branchement Stripe Checkout (désactivé tant que NEXT_PUBLIC_CARE_PAYMENTS n'est pas à 1). */
export function carePaymentsEnabled() {
  return process.env.NEXT_PUBLIC_CARE_PAYMENTS === "1";
}

export async function createCareStripeCheckout(_input: {
  bookingId: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<{ ok: false; reason: "disabled" | "not_implemented" }> {
  if (!carePaymentsEnabled()) return { ok: false, reason: "disabled" };
  return { ok: false, reason: "not_implemented" };
}
