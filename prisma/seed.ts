import { PrismaClient, UserRole, BadgeClassStatus, AssessmentStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const org = await prisma.organization.upsert({
    where: { slug: "bns" },
    update: {},
    create: {
      name: "Beyond No School",
      slug: "bns",
    },
  });

  const superAdmin = await prisma.user.upsert({
    where: { email: "superadmin@beyond-noschool.fr" },
    update: { role: UserRole.SUPER_ADMIN, orgId: org.id },
    create: {
      email: "superadmin@beyond-noschool.fr",
      name: "Super Admin",
      role: UserRole.SUPER_ADMIN,
      orgId: org.id,
    },
  });

  const issuer = await prisma.issuerProfile.upsert({
    where: { id: org.id },
    update: {},
    create: {
      id: org.id,
      orgId: org.id,
      name: "Beyond No School",
      url: "https://www.beyond-noschool.fr",
      email: "certification@beyond-noschool.fr",
      description: "Plateforme de preuves professionnelles.",
      imageUrl: "https://www.beyond-noschool.fr/og.png",
      publicKeys: [
        {
          id: "bns-key-1",
          type: "Ed25519VerificationKey2018",
          publicKeyPem: "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----",
        },
      ],
    },
  });

  const badgeClass = await prisma.badgeClass.upsert({
    where: { id: org.id },
    update: {},
    create: {
      id: org.id,
      orgId: org.id,
      issuerId: issuer.id,
      name: "Preuve Beyond – Commercial Sport",
      description: "Validation d'une compétence commerciale dans le sport business.",
      imageTemplateUrl: "https://www.beyond-noschool.fr/badges/templates/commercial.png",
      criteriaText: "Démontrer une compétence commerciale via un dossier de négociation.",
      tags: ["sport", "commercial", "preuve"],
      status: BadgeClassStatus.ACTIVE,
      version: 1,
    },
  });

  const earner = await prisma.user.upsert({
    where: { email: "earner@beyond-noschool.fr" },
    update: { role: UserRole.EARNER, orgId: org.id },
    create: {
      email: "earner@beyond-noschool.fr",
      name: "Earner Test",
      role: UserRole.EARNER,
      orgId: org.id,
    },
  });

  await prisma.assessment.upsert({
    where: { id: org.id },
    update: {},
    create: {
      id: org.id,
      badgeClassId: badgeClass.id,
      earnerId: earner.id,
      evaluatorId: superAdmin.id,
      status: AssessmentStatus.APPROVED,
      rubric: { score: 85, decision: "approved" },
      decisionAt: new Date(),
      notes: "Seed assessment approved.",
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
