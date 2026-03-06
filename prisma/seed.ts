import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database...');

    // 1. Create Organization
    const orgName = 'PSI Real Estate';
    const orgSlug = 'acme';

    let org = await prisma.organization.findUnique({
        where: { slug: orgSlug },
    });

    if (!org) {
        org = await prisma.organization.create({
            data: {
                name: orgName,
                slug: orgSlug,
            },
        });
        console.log(`Created organization: ${org.name}`);
    } else {
        console.log(`Organization ${org.name} already exists.`);
    }

    // 2. Create User (Admin)
    const email = 'admin@acme.com';
    const plainPassword = 'password123';
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    let user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name: 'Admin User',
                role: 'OWNER',
                organizationId: org.id,
            },
        });
        console.log(`Created user: ${user.email}`);
    } else {
        console.log(`User ${user.email} already exists.`);
    }

    // 2.1 Create Dummy Employees
    const employees = [
        { name: 'Alice Johnson', email: 'alice@acme.com' },
        { name: 'Bob Smith', email: 'bob@acme.com' },
        { name: 'Charlie Brown', email: 'charlie@acme.com' }
    ];

    for (const emp of employees) {
        let empUser = await prisma.user.findUnique({ where: { email: emp.email } });
        if (!empUser) {
            empUser = await prisma.user.create({
                data: {
                    email: emp.email,
                    password: hashedPassword, // Same password for testing
                    name: emp.name,
                    role: 'MEMBER',
                    organizationId: org.id
                }
            });
            console.log(`Created employee: ${emp.name}`);
        }
    }

    // 2.5 Ensure a Workspace Exists
    const wsName = 'Main workspace';
    let workspace = await prisma.workspace.findFirst({
        where: { name: wsName, organizationId: org.id },
    });

    if (!workspace) {
        workspace = await prisma.workspace.create({
            data: {
                name: wsName,
                organizationId: org.id,
            },
        });
        console.log(`Created workspace: ${workspace.name}`);
    }

    // 3. Create Department
    const deptName = 'Engineering';
    let dept = await prisma.department.findFirst({
        where: { name: deptName, workspaceId: workspace.id },
    });

    if (!dept) {
        dept = await prisma.department.create({
            data: {
                name: deptName,
                workspaceId: workspace.id,
            },
        });
        console.log(`Created department: ${dept.name}`);
    }

    // 4. Create Board
    const boardName = 'Product Roadmap';
    let board = await prisma.board.findFirst({
        where: { name: boardName, departmentId: dept.id },
    });

    if (!board) {
        // Define default columns
        const defaultColumns = [
            { id: 'item', type: 'text', title: 'Item', width: 300 },
            { id: 'person', type: 'person', title: 'Person', width: 150 },
            {
                id: 'status', type: 'status', title: 'Status', width: 160, settings: {
                    labels: { 'done': '#00c875', 'working': '#fdab3d', 'stuck': '#e2445c', 'default': '#c4c4c4' }
                }
            },
            { id: 'created_date', type: 'text', title: 'Created Date', width: 150 },
            { id: 'reference_id', type: 'text', title: 'Reference ID', width: 130 },
            { id: 'requester_name', type: 'text', title: 'Requester Name', width: 150 },
            { id: 'request_type', type: 'text', title: 'Request Type', width: 150 },
            { id: 'updates', type: 'updates', title: 'Updates', width: 100, hidden: true },
            { id: 'date', type: 'date', title: 'Date', width: 120, hidden: true },
        ];

        board = await prisma.board.create({
            data: {
                name: boardName,
                departmentId: dept.id,
                columns: JSON.stringify(defaultColumns),
            },
        });
        console.log(`Created board: ${board.name}`);

        // Create dummy tasks
        await prisma.task.create({
            data: {
                name: 'Implement Auth',
                boardId: board.id,
                creatorId: user.id,
                description: 'Implement JWT authentication using NextAuth or custom provider.',
                columnValues: JSON.stringify({ status: 'Done', person: 'Alice Johnson' }),
                assignedUsers: { connect: [{ id: user.id }] }
            }
        });

        await prisma.task.create({
            data: {
                name: 'Design Database Schema',
                boardId: board.id,
                creatorId: user.id,
                description: 'Define tables for Users, Boards, Tasks, and Columns.',
                columnValues: JSON.stringify({ status: 'Working on it' })
            }
        });
    }

    // 5. Create API Key for n8n
    const apiKey = 'sk_test_123456789';
    // Check if exists
    const existingKey = await prisma.apiKey.findUnique({
        where: { key: apiKey } // Try to find by key (unique)
    }).catch(() => null); // Catch error if unique constraint/logic differs or just let create fail if unique

    // Actually schema has key @unique. 
    if (!existingKey) {
        // Create new
        await prisma.apiKey.create({
            data: {
                name: 'n8n Integration',
                key: apiKey,
                organizationId: org.id
            }
        });
        console.log(`Created API Key for n8n: ${apiKey}`);
    }

    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
