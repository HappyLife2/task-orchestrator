'use client';

import { useEffect, useState } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { Loader2, TrendingUp, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface AnalyticsData {
    ongoing: {
        total: number;
        byBoard: Record<string, number>;
        byStatus: Record<string, number>;
        byImportance: Record<string, number>;
        byUrgency: Record<string, number>;
        byType: Record<string, number>;
    };
    done: {
        total: number;
        byBoard: Record<string, number>;
        byStatus: Record<string, number>;
        byImportance: Record<string, number>;
        byUrgency: Record<string, number>;
        byType: Record<string, number>;
    };
}

const COLORS = ['#579bfc', '#00c875', '#e0592a', '#a25ddc', '#ff7575', '#ffcb00', '#ff642e', '#9aadbd'];

export default function DashboardPage() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/analytics')
            .then(res => res.json())
            .then(d => {
                setData(d);
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to fetch analytics:', err);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center bg-[#0a0b1e] text-white">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-[#e0592a]" size={40} />
                    <p className="text-gray-400 font-medium tracking-wide">Orchestrating your analytics...</p>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const prepareChartData = (record: Record<string, number>) =>
        Object.entries(record).map(([name, value]) => ({ name, value }));

    const ongoingByBoard = prepareChartData(data.ongoing.byBoard);
    const ongoingByStatus = prepareChartData(data.ongoing.byStatus);
    const ongoingByImportance = prepareChartData(data.ongoing.byImportance);
    const ongoingByType = prepareChartData(data.ongoing.byType);

    const doneByBoard = prepareChartData(data.done.byBoard);
    const doneByType = prepareChartData(data.done.byType);

    return (
        <div className="flex-1 overflow-auto bg-[#0a0b1e] text-white p-8">
            <div className="max-w-[1400px] mx-auto space-y-8">
                {/* Header Stats */}
                <div className="flex items-center justify-between mb-2">
                    <div>
                        <h1 className="text-[32px] font-bold tracking-tight">System Integrity Dashboard</h1>
                        <p className="text-gray-400 mt-1">Real-time task synchronization and performance metrics across all boards.</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="bg-[#1a1b4b]/40 border border-[#2c2d65] rounded-xl px-4 py-3 flex items-center gap-3">
                            <div className="bg-blue-500/10 p-2 rounded-lg">
                                <TrendingUp className="text-blue-400" size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Ongoing Tasks</p>
                                <p className="text-xl font-bold leading-none">{data.ongoing.total}</p>
                            </div>
                        </div>
                        <div className="bg-[#1a1b4b]/40 border border-[#2c2d65] rounded-xl px-4 py-3 flex items-center gap-3">
                            <div className="bg-green-500/10 p-2 rounded-lg">
                                <CheckCircle className="text-green-400" size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Completed</p>
                                <p className="text-xl font-bold leading-none">{data.done.total}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 1: Ongoing Portfolio */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 px-1">
                        <Clock className="text-[#e0592a]" size={20} />
                        <h2 className="text-xl font-bold">Ongoing Portfolio Analytics</h2>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Board Distribution */}
                        <div className="bg-[#1a1b4b]/30 border border-[#2c2d65] rounded-2xl p-6 hover:bg-[#1a1b4b]/40 transition-colors">
                            <h3 className="text-sm font-semibold text-gray-300 mb-6 uppercase tracking-widest">Active Tasks by Board</h3>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={ongoingByBoard}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#2c2d65" vertical={false} />
                                        <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#151642', border: '1px solid #2c2d65', borderRadius: '8px', fontSize: '12px', color: '#fff' }}
                                            itemStyle={{ color: '#fff' }}
                                            labelStyle={{ color: '#fff', fontWeight: 'bold', marginBottom: '4px' }}
                                            cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                                        />
                                        <Bar dataKey="value" fill="#579bfc" radius={[4, 4, 0, 0]} barSize={40} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Status Breakdown */}
                        <div className="bg-[#1a1b4b]/30 border border-[#2c2d65] rounded-2xl p-6 hover:bg-[#1a1b4b]/40 transition-colors">
                            <h3 className="text-sm font-semibold text-gray-300 mb-6 uppercase tracking-widest">Operational Status Distribution</h3>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={ongoingByStatus}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {ongoingByStatus.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#151642', border: '1px solid #2c2d65', borderRadius: '8px', fontSize: '12px', color: '#fff' }}
                                            itemStyle={{ color: '#fff' }}
                                            labelStyle={{ color: '#fff', fontWeight: 'bold', marginBottom: '4px' }}
                                        />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '20px', color: '#fff' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Importance Hierarchy */}
                        <div className="bg-[#1a1b4b]/30 border border-[#2c2d65] rounded-2xl p-6 hover:bg-[#1a1b4b]/40 transition-colors">
                            <h3 className="text-sm font-semibold text-gray-300 mb-6 uppercase tracking-widest">Strategic Importance levels</h3>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={ongoingByImportance} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" stroke="#2c2d65" horizontal={false} />
                                        <XAxis type="number" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                                        <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} width={100} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#151642', border: '1px solid #2c2d65', borderRadius: '8px', fontSize: '12px', color: '#fff' }}
                                            itemStyle={{ color: '#fff' }}
                                            labelStyle={{ color: '#fff', fontWeight: 'bold', marginBottom: '4px' }}
                                            cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                                        />
                                        <Bar dataKey="value" fill="#a25ddc" radius={[0, 4, 4, 0]} barSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Task Type Breakdown */}
                        <div className="bg-[#1a1b4b]/30 border border-[#2c2d65] rounded-2xl p-6 hover:bg-[#1a1b4b]/40 transition-colors">
                            <h3 className="text-sm font-semibold text-gray-300 mb-6 uppercase tracking-widest">Ongoing Tasks by Category</h3>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={ongoingByType}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {ongoingByType.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} stroke="none" />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#151642', border: '1px solid #2c2d65', borderRadius: '8px', fontSize: '12px', color: '#fff' }}
                                            itemStyle={{ color: '#fff' }}
                                            labelStyle={{ color: '#fff', fontWeight: 'bold', marginBottom: '4px' }}
                                        />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '20px', color: '#fff' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 2: Done Analytics */}
                <div className="pt-4 space-y-6">
                    <div className="flex items-center gap-2 px-1">
                        <CheckCircle className="text-green-500" size={20} />
                        <h2 className="text-xl font-bold">Historical Done Performance</h2>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        <div className="bg-[#1a1b4b]/30 border border-[#2c2d65] rounded-2xl p-6 hover:bg-[#1a1b4b]/40 transition-colors">
                            <h3 className="text-sm font-semibold text-gray-300 mb-6 uppercase tracking-widest">Completed Items per Board</h3>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={doneByBoard}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#2c2d65" vertical={false} />
                                        <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#151642', border: '1px solid #2c2d65', borderRadius: '8px', fontSize: '12px', color: '#fff' }}
                                            itemStyle={{ color: '#fff' }}
                                            labelStyle={{ color: '#fff', fontWeight: 'bold', marginBottom: '4px' }}
                                            cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                                        />
                                        <Bar dataKey="value" fill="#00c875" radius={[4, 4, 0, 0]} barSize={40} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
