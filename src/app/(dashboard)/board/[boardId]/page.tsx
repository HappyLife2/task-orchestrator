import BoardView from '@/components/BoardView';

export default function BoardPage({ params }: { params: { boardId: string } }) {
    return <BoardView boardId={params.boardId} />;
}
