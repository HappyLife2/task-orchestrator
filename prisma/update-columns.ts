import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const boards = await prisma.board.findMany();

    const requiredColumns = [
        { id: 'item', type: 'text', title: 'Item', width: 300 },
        { id: 'person', type: 'person', title: 'Person', width: 150 },
        {
            id: 'status', type: 'status', title: 'Status', width: 160, settings: {
                status: {
                    labels: {
                        'stuck': '#D9717F',
                        'done': '#6AD096',
                        'working on it': '#F3BF73',
                        'to be actioned': '#549CC9',
                        'on hold': '#7A7E91'
                    }
                }
            }
        },
        { id: 'created_date', type: 'text', title: 'Created Date', width: 150 },
        { id: 'reference_id', type: 'text', title: 'Reference ID', width: 130 },
        { id: 'requester_name', type: 'text', title: 'Requester Name', width: 150 },
        { id: 'request_type', type: 'text', title: 'Request Type', width: 150 }
    ];

    for (const board of boards) {
        let columns: any[] = [];
        try {
            columns = JSON.parse(board.columns || '[]');
        } catch (e) {
            columns = [];
        }

        const requiredIds = requiredColumns.map(c => c.id);

        const updatedColumns = columns.map(col => {
            if (!requiredIds.includes(col.id)) {
                return { ...col, hidden: true };
            }
            return { ...col, hidden: false };
        });

        for (const reqCol of requiredColumns) {
            if (!updatedColumns.find(c => c.id === reqCol.id)) {
                updatedColumns.push(reqCol);
            }
        }

        const sortedColumns = [
            ...requiredColumns.map(rc => updatedColumns.find(c => c.id === rc.id)!),
            ...updatedColumns.filter(c => !requiredIds.includes(c.id))
        ];

        console.log(`Updating columns for board: ${board.name}`);
        await prisma.board.update({
            where: { id: board.id },
            data: { columns: JSON.stringify(sortedColumns) }
        });
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
