import { PrismaClient } from "@prisma/client";

const password = process.env.SUPABASE_DB_PASSWORD?.trim();
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
if (!password || !supabaseUrl) {
  console.error("Missing SUPABASE_DB_PASSWORD or NEXT_PUBLIC_SUPABASE_URL");
  process.exit(1);
}

const ref = new URL(supabaseUrl).hostname.split(".")[0];
const encoded = encodeURIComponent(password);
const region = process.env.SUPABASE_DB_REGION?.trim();

const urls = [
  process.env.DATABASE_URL?.trim(),
  region
    ? `postgresql://postgres.${ref}:${encoded}@aws-0-${region}.pooler.supabase.com:5432/postgres`
    : null,
  `postgresql://postgres.${ref}:${encoded}@db.${ref}.supabase.co:5432/postgres`,
  `postgresql://postgres:${encoded}@db.${ref}.supabase.co:5432/postgres`,
].filter(Boolean);

for (const url of urls) {
  const label = url.includes("postgres.") && url.includes("@db.")
    ? "session"
    : url.includes("pooler")
      ? "pooler-aws"
      : url.includes("DATABASE_URL")
        ? "env"
        : "direct";
  const prisma = new PrismaClient({ datasources: { db: { url } } });
  try {
    await prisma.$connect();
    console.log(`OK (${label})`);
    await prisma.$disconnect();
    process.exit(0);
  } catch (e) {
    console.error(`FAIL (${label}):`, e.message?.split("\n")[0] ?? e);
    await prisma.$disconnect().catch(() => {});
  }
}

process.exit(1);
