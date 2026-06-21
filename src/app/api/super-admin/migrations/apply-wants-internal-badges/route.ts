import { NextRequest, NextResponse } from "next/server";
import pg from "pg";
import { readFileSync } from "fs";
import { join } from "path";
import { isSuperAdmin } from "@/lib/auth/super-admin";

export const runtime = "nodejs";
export const maxDuration = 60;

function buildConnectionString(): string | null {
  const password = process.env.SUPABASE_DB_PASSWORD?.trim();
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "").trim();
  const ref = url.replace("https://", "").replace(".supabase.co", "");
  if (!password || !ref) return null;
  return `postgresql://postgres.${ref}:${encodeURIComponent(password)}@db.${ref}.supabase.co:5432/postgres`;
}

export async function POST(request: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET?.trim();
    const headerSecret = request.headers.get("x-cron-secret")?.trim();
    const hasCronAuth = Boolean(cronSecret && headerSecret && cronSecret === headerSecret);
    const hasAccess = hasCronAuth || (await isSuperAdmin());
    if (!hasAccess) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const connectionString = buildConnectionString();
    if (!connectionString) {
      return NextResponse.json(
        { error: "SUPABASE_DB_PASSWORD ou NEXT_PUBLIC_SUPABASE_URL manquant" },
        { status: 503 },
      );
    }

    const sql = readFileSync(
      join(process.cwd(), "supabase/migrations/20260621120000_organizations_wants_internal_badges.sql"),
      "utf8",
    );

    const client = new pg.Client({
      connectionString,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 30000,
    });

    await client.connect();
    await client.query(sql);

    const { rows } = await client.query<{ name: string; slug: string | null }>(`
      SELECT name, slug
      FROM public.organizations
      WHERE wants_internal_badges = true
      ORDER BY name
    `);

    await client.end();

    return NextResponse.json({
      ok: true,
      enabledCount: rows.length,
      organizations: rows,
    });
  } catch (error) {
    console.error("[apply-wants-internal-badges]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Migration failed" },
      { status: 500 },
    );
  }
}
