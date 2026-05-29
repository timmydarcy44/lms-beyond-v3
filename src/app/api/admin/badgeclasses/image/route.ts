import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import path from "node:path";
import fs from "node:fs/promises";
import { requireRole } from "@/lib/auth/require-role";
import { UserRole } from "@prisma/client";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { uploadBuffer } from "@/lib/storage/s3";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml"] as const;

const MIME_TO_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/svg+xml": "svg",
};

const STORAGE_BUCKET = "public";

function resolveExtension(contentType: string, fileName: string): string {
  const fromMime = MIME_TO_EXT[contentType];
  if (fromMime) return fromMime;
  const fromName = fileName.split(".").pop()?.toLowerCase();
  if (fromName === "jpeg") return "jpg";
  if (fromName && ["png", "jpg", "svg"].includes(fromName)) return fromName;
  return "png";
}

function isS3Configured(): boolean {
  return Boolean(
    process.env.S3_BUCKET && process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY,
  );
}

async function uploadToLocalDev(params: {
  orgId: string;
  buffer: Buffer;
  contentType: string;
  fileName: string;
}): Promise<string> {
  const extension = resolveExtension(params.contentType, params.fileName);
  const uploadsDir = path.join(process.cwd(), "public", "uploads", "openbadges");
  await fs.mkdir(uploadsDir, { recursive: true });
  const safeBase = (params.fileName || "image")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/(^-+|-+$)/g, "");
  const safeName = `${params.orgId}-${Date.now()}-${safeBase || "image"}`;
  const fileName = safeName.endsWith(`.${extension}`) ? safeName : `${safeName}.${extension}`;
  const fullPath = path.join(uploadsDir, fileName);
  await fs.writeFile(fullPath, params.buffer);
  return `/uploads/openbadges/${fileName}`;
}

async function uploadToSupabase(params: {
  orgId: string;
  buffer: Buffer;
  contentType: string;
  fileName: string;
}): Promise<string> {
  const supabase = getServiceRoleClient();
  if (!supabase) {
    throw new Error("SUPABASE_SERVICE_ROLE_UNAVAILABLE");
  }

  const extension = resolveExtension(params.contentType, params.fileName);
  const storagePath = `openbadges/badgeclasses/${params.orgId}/${crypto.randomUUID()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, params.buffer, {
      contentType: params.contentType,
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`SUPABASE_UPLOAD_FAILED: ${uploadError.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath);

  if (!publicUrl) {
    throw new Error("SUPABASE_NO_PUBLIC_URL");
  }

  return publicUrl;
}

export async function POST(request: NextRequest) {
  if (!request.headers.get("x-org-id")) {
    return NextResponse.json({ ok: false, error: "MISSING_ORG_ID" }, { status: 400 });
  }
  const auth = requireRole(request, [UserRole.SUPER_ADMIN]);
  if (!auth.ok) return auth.response;

  try {
    const formData = await request.formData();
    const file = formData.get("file") ?? formData.get("image");
    const isDryRun = request.nextUrl.searchParams.get("dryRun") === "1";

    if (!file || typeof file === "string") {
      return NextResponse.json({ ok: false, error: "MISSING_FILE" }, { status: 400 });
    }

    const contentType = file.type || "application/octet-stream";
    if (!ALLOWED_TYPES.includes(contentType as (typeof ALLOWED_TYPES)[number])) {
      return NextResponse.json(
        { ok: false, error: "INVALID_CONTENT_TYPE", details: contentType },
        { status: 400 },
      );
    }

    if (isDryRun) {
      return NextResponse.json(
        {
          ok: true,
          filename: file.name,
          mime: contentType,
          size: file.size,
        },
        { status: 200 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const extension = resolveExtension(contentType, file.name);
    const uploadParams = {
      orgId: auth.user.orgId,
      buffer,
      contentType,
      fileName: file.name,
    };

    let imageUrl: string | null = null;
    let provider: "s3" | "supabase" | "local" = "supabase";

    if (isS3Configured()) {
      provider = "s3";
      const key = `openbadges/badgeclasses/${auth.user.orgId}/${crypto.randomUUID()}.${extension}`;
      imageUrl = await uploadBuffer({
        key,
        buffer,
        contentType,
        isPublic: true,
      });
    } else if (getServiceRoleClient()) {
      imageUrl = await uploadToSupabase(uploadParams);
    } else if (process.env.NODE_ENV !== "production") {
      provider = "local";
      imageUrl = await uploadToLocalDev(uploadParams);
    }

    if (!imageUrl) {
      return NextResponse.json(
        {
          ok: false,
          error: "STORAGE_NOT_CONFIGURED",
          hint: "Configurez S3 (S3_BUCKET, clés) ou SUPABASE_SERVICE_ROLE_KEY pour l’upload.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, imageUrl, provider }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const name = error instanceof Error ? error.name : "Error";
    const provider = message.includes("S3_")
      ? "s3"
      : message.includes("SUPABASE")
        ? "supabase"
        : "unknown";
    if (process.env.NODE_ENV !== "production") {
      console.error("[badgeclass][upload][server]", {
        orgId: auth.user.orgId,
        message,
        name,
      });
    }
    return NextResponse.json(
      {
        ok: false,
        error: "UPLOAD_FAILED",
        provider,
        details: {
          message,
          name,
          ...(process.env.NODE_ENV !== "production"
            ? { stack: error instanceof Error ? error.stack : undefined }
            : {}),
        },
      },
      { status: 500 },
    );
  }
}
