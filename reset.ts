import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "View", "Table", "Base" CASCADE`);
}

main().finally(() => prisma.$disconnect());