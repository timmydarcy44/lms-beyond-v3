import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { BadgeClassStatus } from "@prisma/client";
import { buildAssertion } from "@/lib/openbadges/v2/builders";
import { getBaseUrl } from "@/lib/openbadges/urls";
import { bakePng } from "@/lib/openbadges/baking/png";
import { uploadBuffer } from "@/lib/storage/s3";

export const issueBadge = async (_request: Request, assessmentId: string) => {
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    include: {
      badgeClass: { include: { issuer: true } },
      earner: true,
      evidence: true,
    },
  });

  if (!assessment) {
    throw new Error("ASSESSMENT_NOT_FOUND");
  }
  if (assessment.status !== "APPROVED") {
    throw new Error("ASSESSMENT_NOT_APPROVED");
  }
  if (assessment.badgeClass.status !== BadgeClassStatus.ACTIVE) {
    throw new Error("BADGECLASS_NOT_ACTIVE");
  }

  const assertionId = crypto.randomUUID();
  const salt = crypto.randomUUID().replace(/-/g, "");
  const hostedUrl = `${getBaseUrl()}/api/public/assertions/${assertionId}`;
  const badgeClass = assessment.badgeClass;
  const issuer = badgeClass.issuer;

  const assertion = buildAssertion({
    id: hostedUrl,
    badgeClassId: `${getBaseUrl()}/api/public/badgeclasses/${badgeClass.id}`,
    issuerId: `${getBaseUrl()}/api/public/issuers/${issuer.id}`,
    recipientEmail: assessment.earner.email,
    recipientSalt: salt,
    issuedOn: new Date(),
    evidenceUrls: assessment.evidence
      .map((evidence) => evidence.url)
      .filter((url): url is string => Boolean(url)),
    verification: { type: "hosted", url: hostedUrl },
    version: badgeClass.version,
  });

  const record = await prisma.assertion.create({
    data: {
      id: assertionId,
      badgeClassId: badgeClass.id,
      issuerId: issuer.id,
      earnerId: assessment.earnerId,
      assessmentId: assessment.id,
      recipientIdentifierHash: assertion.recipient.identity,
      recipientSalt: salt,
      issuedOn: new Date(),
      expires: null,
      evidenceRefs: assessment.evidence.map((evidence) => ({
        id: evidence.url ?? evidence.fileKey ?? evidence.id,
        narrative: evidence.description ?? undefined,
      })),
      verificationType: "HOSTED",
      hostedUrl,
      revoked: false,
    },
  });

  const badgeImageResponse = await fetch(badgeClass.imageTemplateUrl);
  if (!badgeImageResponse.ok) {
    throw new Error("BADGE_IMAGE_FETCH_FAILED");
  }
  const badgeImageBuffer = Buffer.from(await badgeImageResponse.arrayBuffer());
  const baked = bakePng(badgeImageBuffer, hostedUrl);
  const bakedKey = `badges/${record.id}.png`;
  const bakedImageUrl = await uploadBuffer({
    key: bakedKey,
    buffer: baked,
    contentType: "image/png",
    isPublic: true,
  });

  await prisma.assertion.update({
    where: { id: record.id },
    data: {
      bakedImageUrl,
    },
  });

  return {
    assertionId: record.id,
    hostedUrl,
    bakedImageUrl,
  };
};
