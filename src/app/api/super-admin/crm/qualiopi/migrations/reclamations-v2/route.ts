import { readFileSync } from "fs";
import { join } from "path";
import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Applique la migration Qualité v2 (DDL).
 * Utilise SUPABASE_DB_PASSWORD + pooler, ou body.database_url / body.db_password.
 */
export async function POST(req: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    database_url?: string;
    db_password?: string;
  };

  let pg: typeof import("pg");
  try {
    pg = await import("pg");
  } catch {
    return NextResponse.json({ error: "Module pg indisponible" }, { status: 503 });
  }

  const sqlPath = join(process.cwd(), "supabase/migrations/20261116160000_qualiopi_reclamations_v2.sql");
  let sql: string;
  try {
    sql = readFileSync(sqlPath, "utf8");
  } catch {
    return NextResponse.json({ error: "Fichier SQL introuvable" }, { status: 500 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const envPassword = process.env.SUPABASE_DB_PASSWORD || process.env.POSTGRES_PASSWORD;
  const password = body.db_password || envPassword;
  const ref = supabaseUrl ? new URL(supabaseUrl).hostname.split(".")[0] : null;

  const candidates: string[] = [];
  if (body.database_url) candidates.push(body.database_url);
  if (password && ref) {
    for (const host of [
      "aws-0-eu-west-1.pooler.supabase.com",
      "aws-0-eu-central-1.pooler.supabase.com",
      "aws-1-eu-central-1.pooler.supabase.com",
      "aws-0-eu-west-2.pooler.supabase.com",
      "aws-0-eu-west-3.pooler.supabase.com",
    ]) {
      candidates.push(
        `postgresql://postgres.${ref}:${encodeURIComponent(password)}@${host}:6543/postgres`,
      );
      candidates.push(
        `postgresql://postgres.${ref}:${encodeURIComponent(password)}@${host}:5432/postgres`,
      );
    }
  }

  if (!candidates.length) {
    return NextResponse.json(
      {
        error:
          "Pas de DATABASE_URL / SUPABASE_DB_PASSWORD. Passez database_url ou db_password dans le body.",
      },
      { status: 400 },
    );
  }

  const errors: string[] = [];
  for (const cs of candidates) {
    const host = cs.includes("@") ? cs.split("@")[1]?.split("/")[0] : "?";
    const client = new pg.Client({
      connectionString: cs,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 8000,
    });
    try {
      await client.connect();
      await client.query("begin");
      await client.query(sql);
      await client.query("commit");
      await client.end();
      return NextResponse.json({ ok: true, via: host });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`${host}: ${msg.slice(0, 160)}`);
      try {
        await client.query("rollback");
      } catch {
        /* ignore */
      }
      try {
        await client.end();
      } catch {
        /* ignore */
      }
    }
  }

  return NextResponse.json(
    {
      error: "Migration non appliquée — mot de passe DB invalide ou hôte injoignable",
      attempts: errors.slice(0, 8),
      hint: "Coller supabase/migrations/20261116160000_qualiopi_reclamations_v2.sql dans le SQL Editor Supabase, ou fournir database_url.",
    },
    { status: 503 },
  );
}

export async function GET() {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  return NextResponse.json({
    migration: "20261116160000_qualiopi_reclamations_v2.sql",
    apply: "POST avec database_url ou db_password, ou coller le SQL dans le dashboard Supabase",
  });
}
