const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const user = await prisma.user.findFirst();
        console.log("User Org ID:", user.organizationId);

        console.log("Testing Org Query...");
        const org = await prisma.organization.findUnique({
            where: { id: user.organizationId },
            include: {
                departments: {
                    include: { boards: { select: { id: true, name: true } } },
                },
            },
        });
        console.log("Org result valid:", !!org);

        console.log("Testing Analytics Query...");
        const boards = await prisma.board.findMany({
            where: { department: { organizationId: user.organizationId } },
            include: {
                groups: true,
                tasks: {
                    where: { state: 'ACTIVE', parentTaskId: null }
                }
            }
        });
        console.log("Boards count:", boards.length);
        console.log("Success!");
    } catch (error) {
        console.error("PRISMA CRASH:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
