'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (res.ok) {
                router.push('/dashboard');
                router.refresh();
            } else {
                const data = await res.json();
                setError(data.error || 'Login failed');
            }
        } catch {
            setError('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-[#1a1b4b] p-8 rounded-lg shadow-xl border border-[rgba(255,255,255,0.12)]">
            <h2 className="text-2xl font-bold mb-6 text-white">Sign in to your account</h2>
            {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded mb-4 text-sm">
                    {error}
                </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-300">Email address</label>
                    <input
                        type="email"
                        required
                        className="mt-1 block w-full rounded-md border border-[rgba(255,255,255,0.12)] bg-[#0f102a] text-white px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300">Password</label>
                    <input
                        type="password"
                        required
                        className="mt-1 block w-full rounded-md border border-[rgba(255,255,255,0.12)] bg-[#0f102a] text-white px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
                <div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex w-full justify-center rounded-md bg-[#e0592a] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#c94e23] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-50"
                    >
                        {loading ? 'Signing in...' : 'Sign in'}
                    </button>
                </div>
            </form>
            <p className="mt-4 text-center text-sm text-gray-400">
                Not a member?{' '}
                <Link href="/register" className="font-semibold text-[#e0592a] hover:text-[#c94e23]">
                    Start a 14 day free trial
                </Link>
            </p>
        </div>
    );
}
