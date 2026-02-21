import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const boards = await prisma.board.findMany({
        select: {
            id: true,
            name: true,
        }
    });
    console.log(JSON.stringify(boards, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
