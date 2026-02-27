import Sidebar from '@/components/Sidebar';
import { NotificationListener } from '@/components/NotificationListener';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen overflow-hidden bg-[#0f102a]">
            <Sidebar />
            <NotificationListener />
            <main className="flex-1 overflow-y-auto overflow-x-hidden">
                {children}
            </main>
        </div>
    );
}
