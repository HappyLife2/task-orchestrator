const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
async function main() {
  const orgs = await prisma.organization.findMany();
  for (const org of orgs) {
    await prisma.organization.update({
      where: { id: org.id },
      data: { name: "PSI Real Estate" }
    });
  }
  console.log("Updated all orgs to PSI Real Estate");
}
main().catch(console.error).finally(() => prisma.$disconnect());