'use client';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="flex flex-col items-center justify-center p-8 text-white min-h-screen">
            <h2 className="text-xl text-red-500 font-bold mb-4">Something went wrong!</h2>
            <pre className="bg-black/50 p-4 rounded-md overflow-auto max-w-full text-sm text-red-300">
                {error.message}
                {'\n'}
                {error.stack}
            </pre>
            <button
                className="mt-6 px-4 py-2 bg-indigo-600 rounded-md hover:bg-indigo-500"
                onClick={() => reset()}
            >
                Try again
            </button>
        </div>
    );
}
