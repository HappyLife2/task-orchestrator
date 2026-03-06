// @ts-nocheck
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting workspace migration...');

    // 1. Fetch all unique organizations that have departments
    const organizations = await prisma.organization.findMany({
        include: { departments: true }
    });

    console.log(`Found ${organizations.length} organizations.`);

    for (const org of organizations) {
        if (org.departments.length === 0) continue;

        console.log(`Processing org: ${org.name}`);

        // 2. See if there is already a Workspace. If yes, this org might already be migrated or partially migrated.
        let defaultWorkspace = await (prisma as any).workspace.findFirst({
            where: { organizationId: org.id }
        });

        // 3. If no workspace exists, create the default "Main workspace"
        if (!defaultWorkspace) {
            defaultWorkspace = await (prisma as any).workspace.create({
                data: {
                    id: crypto.randomUUID(),
                    name: 'Main workspace',
                    description: 'Default workspace containing legacy departments and boards.',
                    organizationId: org.id,
                }
            });
            console.log(`Created default workspace '${defaultWorkspace.name}' for org ${org.name}`);
        } else {
            console.log(`Default workspace '${defaultWorkspace.name}' already exists for org ${org.name}`);
        }

        // 4. Move all departments pointing to this org's ID -> to point to the workspace ID instead
        // The Prisma schema has already changed `organizationId` on Department to `workspaceId`.
        // Native SQL is safer here during the schema transition boundary to avoid strict type-checking issues if the client is out of sync.
        try {
            const updateCount = await prisma.$executeRaw`
                UPDATE Department 
                SET workspaceId = ${defaultWorkspace.id} 
                WHERE organizationId = ${org.id} OR workspaceId = ${org.id} OR workspaceId IS NULL OR workspaceId = ''
            `;
            console.log(`Migrated ${updateCount} departments into the new workspace.`);
        } catch (e: any) {
            console.error(`Error migrating departments:`, e.message);
        }
    }

    console.log('Migration complete!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
