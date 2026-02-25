const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const user = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
        if (!user) {
            console.log("No admin found");
            return;
        }
        console.log("Found ADMIN:", user.email);

        const org = await prisma.organization.findUnique({
            where: { id: user.organizationId },
            include: {
                departments: {
                    include: {
                        boards: {
                            where: user.role === 'ADMIN' ? {} : {
                                members: {
                                    some: {
                                        userId: user.id
                                    }
                                }
                            },
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        });

        console.log("Org departments:");
        console.log(JSON.stringify(org.departments, null, 2));
    } catch (error) {
        console.error("PRISMA CRASH:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
