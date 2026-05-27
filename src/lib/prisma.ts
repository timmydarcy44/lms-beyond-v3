import { PrismaClient } from "@prisma/client";
import { getDatabaseUrl, resolveAndApplyDatabaseUrl } from "@/lib/db/database-url";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
  // eslint-disable-next-line no-var
  var prismaDatabaseUrl: string | undefined;
}

function createPrismaClient(): PrismaClient {
  const url = resolveAndApplyDatabaseUrl();
  return new PrismaClient({
    ...(url ? { datasources: { db: { url } } } : {}),
    log: ["error", "warn"],
  });
}

function getPrismaSingleton(): PrismaClient {
  const url = resolveAndApplyDatabaseUrl();

  if (global.prisma && url && global.prismaDatabaseUrl !== url) {
    void global.prisma.$disconnect().catch(() => {});
    global.prisma = undefined;
  }

  if (!global.prisma) {
    global.prisma = createPrismaClient();
    global.prismaDatabaseUrl = url;
  }

  return global.prisma;
}

export const prisma = getPrismaSingleton();

export { getDatabaseUrl, resolveAndApplyDatabaseUrl } from "@/lib/db/database-url";
