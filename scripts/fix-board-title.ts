import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const result = await prisma.board.update({
        where: { id: "db7f7ecb-bb7a-4d7c-bef8-1dc8eabe7a9c" },
        data: { name: "Product Roadmap" }
    });
    console.log("Updated board:", result.name);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
