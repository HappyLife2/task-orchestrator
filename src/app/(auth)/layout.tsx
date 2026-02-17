export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#0f102a] text-white">
            <div className="w-full max-w-md space-y-8 px-4 sm:px-0">
                <div className="text-center">
                    <h1 className="text-3xl font-bold tracking-tight text-white">Task Orchestrator</h1>
                    <p className="mt-2 text-sm text-gray-400">Enterprise Task Management</p>
                </div>
                {children}
            </div>
        </div>
    );
}
