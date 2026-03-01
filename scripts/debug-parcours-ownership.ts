#!/usr/bin/env tsx
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

const usage = `
Usage:
  pnpm tsx scripts/debug-parcours-ownership.ts <PARCOURS_ID> <USER_ID>
`;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const envCandidates = [".env.local", ".env"];
for (const filename of envCandidates) {
  const envPath = path.join(projectRoot, filename);
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

async function main() {
  const [, , parcoursId, userId] = process.argv;

  if (!parcoursId || !userId) {
    console.error(usage.trim());
    process.exit(1);
  }

  const supabaseUrl =
    process.env.SUPABASE_URL?.trim() ??
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ??
    null;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !serviceKey) {
    const missing: string[] = [];
    if (!supabaseUrl) missing.push("SUPABASE_URL (fallbacks to NEXT_PUBLIC_SUPABASE_URL)");
    if (!serviceKey) missing.push("SUPABASE_SERVICE_ROLE_KEY");

    const keyPreview = serviceKey
      ? `${serviceKey.slice(0, 12)}…`
      : null;

    console.error(
      [
        "Missing required env var(s):",
        `  - ${missing.join(", ")}`,
        "",
        "Set them before running this script. Examples:",
        '  PowerShell : $env:SUPABASE_URL="https://xxx.supabase.co"',
        '                $env:SUPABASE_SERVICE_ROLE_KEY="service-role-key"',
        '  Bash/zsh   : export SUPABASE_URL="https://xxx.supabase.co"',
        '              export SUPABASE_SERVICE_ROLE_KEY="service-role-key"',
        keyPreview ? `Current key preview (12 chars): ${keyPreview}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    );
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  const { data: path, error: pathError } = await supabase
    .from("paths")
    .select("id, owner_id, creator_id")
    .eq("id", parcoursId)
    .maybeSingle();

  if (pathError) {
    console.error("[debug] paths lookup error:", pathError.message);
  }

  if (!path) {
    console.log("[debug] Path not found or inaccessible via service role.");
  } else {
    const ownerId = path.owner_id ?? null;
    const creatorId = path.creator_id ?? null;
    const isOwner =
      ownerId === userId || creatorId === userId;

    console.log("[debug] Path record:", {
      id: path.id,
      ownerId,
      creatorId,
      userIsOwnerOrCreator: isOwner,
    });
  }

  try {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, role")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) {
      console.warn("[debug] profiles lookup error:", profileError.message);
    } else if (profile) {
      console.log("[debug] Profile record:", {
        id: profile.id,
        email: profile.email ?? null,
        role: profile.role ?? null,
      });
    } else {
      console.log("[debug] Profile not found for user", userId);
    }
  } catch (error) {
    console.warn(
      "[debug] profiles lookup unexpected error:",
      error instanceof Error ? error.message : String(error),
    );
  }
}

main().catch((error) => {
  console.error("[debug] Unexpected error:", error instanceof Error ? error.message : error);
  process.exit(1);
});

