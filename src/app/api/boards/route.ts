import { NextRequest, NextResponse } from 'next/server';
import { db, verifyToken } from '@/lib/auth';

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

export async function POST(req: NextRequest) {
    const token = req.cookies.get('token')?.value;
    const payload = verifyToken(token || '');

    if (!payload) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { name, departmentId } = body;

        if (!name || !departmentId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const board = await db.board.create({
            data: {
                name,
                departmentId,
                columns: JSON.stringify(defaultColumns),
            },
        });

        // Initialize default group
        await db.group.create({
            data: {
                boardId: board.id,
                title: 'Group Title',
                color: '#579bfc',
                position: 0,
            },
        });

        // Initialize default Table view
        await db.boardView.create({
            data: {
                boardId: board.id,
                name: 'Main Table',
                type: 'table',
                isDefault: true,
                position: 0,
            },
        });

        return NextResponse.json(board);
    } catch (error) {
        console.error('Error creating board:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
