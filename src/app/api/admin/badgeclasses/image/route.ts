import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import path from "node:path";
import fs from "node:fs/promises";
import { requireRole } from "@/lib/auth/require-role";
import { UserRole } from "@prisma/client";
import { uploadBuffer } from "@/lib/storage/s3";

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
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml"];
    if (!allowedTypes.includes(contentType)) {
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
    const extension = contentType.split("/")[1] || "png";
    const key = `openbadges/badgeclasses/${auth.user.orgId}/${crypto.randomUUID()}.${extension}`;

    const missingEnv: string[] = [];
    if (!process.env.S3_BUCKET) missingEnv.push("S3_BUCKET");
    if (!process.env.S3_ACCESS_KEY_ID) missingEnv.push("S3_ACCESS_KEY_ID");
    if (!process.env.S3_SECRET_ACCESS_KEY) missingEnv.push("S3_SECRET_ACCESS_KEY");

    if (missingEnv.length > 0) {
      if (process.env.NODE_ENV !== "production") {
        const uploadsDir = path.join(process.cwd(), "public", "uploads", "openbadges");
        await fs.mkdir(uploadsDir, { recursive: true });
        const safeBase = (file.name || "image")
          .toLowerCase()
          .replace(/[^a-z0-9._-]+/g, "-")
          .replace(/(^-+|-+$)/g, "");
        const safeName = `${auth.user.orgId}-${Date.now()}-${safeBase || "image"}`;
        const fileName = safeName.endsWith(`.${extension}`) ? safeName : `${safeName}.${extension}`;
        const fullPath = path.join(uploadsDir, fileName);
        await fs.writeFile(fullPath, buffer);
        return NextResponse.json(
          { ok: true, imageUrl: `/uploads/openbadges/${fileName}` },
          { status: 200 },
        );
      }
      return NextResponse.json(
        {
          ok: false,
          error: "STORAGE_NOT_CONFIGURED",
          provider: "s3",
          hint: `Missing ${missingEnv.join(", ")}`,
        },
        { status: 500 },
      );
    }

    const imageUrl = await uploadBuffer({
      key,
      buffer,
      contentType,
      isPublic: true,
    });

    if (!imageUrl) {
      return NextResponse.json(
        { ok: false, error: "STORAGE_NO_URL", provider: "s3" },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, imageUrl }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const name = error instanceof Error ? error.name : "Error";
    const provider = message.includes("S3_") ? "s3" : "unknown";
    const hint = message.includes("S3_BUCKET missing") ? "Missing S3_BUCKET" : undefined;
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
        ...(hint ? { hint } : {}),
      },
      { status: 500 },
    );
  }
}
