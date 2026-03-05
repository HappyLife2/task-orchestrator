export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#0f102a] text-white">
            <div className="w-full max-w-md space-y-8 px-4 sm:px-0">
                <div className="text-center">
                    <div className="flex flex-col items-center gap-6">
                        <div className="flex items-center gap-3">
                            <img src="/logo.png" alt="PSI Logo" className="w-12 h-12 rounded-lg object-contain bg-white p-1" />
                            <h1 className="text-3xl font-bold tracking-tight text-white">PSI Real Estate</h1>
                        </div>
                        <p className="text-gray-400">Sign in to your account to continue</p>
                    </div>
                </div>
                {children}
            </div>
        </div>
    );
}
