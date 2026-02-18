import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const defaultColumns = [
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
    { id: 'updates', type: 'updates', title: 'Updates', width: 100 },
    {
        id: 'importance', type: 'dropdown', title: 'Importance', width: 150, settings: {
            options: [
                { label: 'Sacrosanct', value: 'sacrosanct', color: '#BC6277' },
                { label: 'High', value: 'high', color: '#EB549F' },
                { label: 'Medium', value: 'medium', color: '#90659E' },
                { label: 'Low', value: 'low', color: '#7A7E91' }
            ]
        }
    },
    {
        id: 'urgency', type: 'dropdown', title: 'Urgency', width: 150, settings: {
            options: [
                { label: 'Urgent', value: 'urgent', color: '#F23C8F' },
                { label: 'Next', value: 'next', color: '#3E9B73' },
                { label: 'Upcoming', value: 'upcoming', color: '#79A2D8' },
                { label: 'Need review', value: 'need_review', color: '#A173CF' },
                { label: 'On Hold', value: 'on_hold', color: '#7A7E91' }
            ]
        }
    },
    { id: 'timeline', type: 'timeline', title: 'Timeline', width: 200 },
    {
        id: 'task_load', type: 'dropdown', title: 'Task Load', width: 160, settings: {
            options: [
                { label: 'Runes Awakened', value: 'runes_awakened', color: '#F34D9C' },
                { label: 'Big Pot', value: 'big_pot', color: '#CF7FB0' },
                { label: 'Double Shot', value: 'double_shot', color: '#6A4F4A' },
                { label: 'Espresso Shot', value: 'espresso_shot', color: '#C9927E' },
                { label: 'On Hold', value: 'on_hold', color: '#7A7E91' }
            ]
        }
    },
    { id: 'reference_id', type: 'text', title: 'Reference ID', width: 130 }
];

async function main() {
    console.log('Updating boards with new default columns...');

    const boards = await prisma.board.findMany();

    for (const board of boards) {
        // Parse existing columns to preserve custom settings if needed, 
        // but since we want to overwrite with new defaults for this task:

        await prisma.board.update({
            where: { id: board.id },
            data: {
                columns: JSON.stringify(defaultColumns)
            }
        });
        console.log(`Updated board: ${board.name} (${board.id})`);
    }

    console.log('Done!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
