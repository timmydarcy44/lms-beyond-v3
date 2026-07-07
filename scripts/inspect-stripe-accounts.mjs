import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const KEYS = [
  "STRIPE_SECRET_KEY",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_EDGE_ACCOMPAGNEMENT_WEBHOOK_SECRET",
  "STRIPE_PRICE_ID_COACHING_PROGRESS",
  "STRIPE_PRICE_ID_SIMULATION_PRO",
  "NEVO_STRIPE_SECRET_KEY",
  "NEXT_PUBLIC_NEVO_STRIPE_PUBLISHABLE_KEY",
  "NEVO_STRIPE_WEBHOOK_SECRET",
];

function describeKey(name, value) {
  if (!value?.trim()) return `${name}: absent`;
  const v = value.trim();
  const mode = v.includes("_live_") ? "live" : v.includes("_test_") ? "test" : "unknown";
  return `${name}: ${mode} (${v.slice(0, 16)}…)`;
}

console.log("=== Variables Stripe (.env.local) ===\n");
for (const k of KEYS) console.log(describeKey(k, process.env[k]));

async function fetchAccount(label, secretKey) {
  if (!secretKey?.trim()) return;
  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(secretKey.trim(), { apiVersion: "2025-10-29.clover" });
    const account = await stripe.accounts.retrieve();
    console.log(`\n=== Compte ${label} ===`);
    console.log("id:", account.id);
    console.log("email:", account.email ?? "—");
    console.log("business:", account.business_profile?.name ?? account.settings?.dashboard?.display_name ?? "—");
    console.log("country:", account.country ?? "—");
    console.log("charges_enabled:", account.charges_enabled);
  } catch (err) {
    console.log(`\n=== Compte ${label} ===`);
    console.log("erreur:", err?.message ?? err);
  }
}

await fetchAccount("Beyond (STRIPE_SECRET_KEY)", process.env.STRIPE_SECRET_KEY);
await fetchAccount("Nevo (NEVO_STRIPE_SECRET_KEY)", process.env.NEVO_STRIPE_SECRET_KEY);
