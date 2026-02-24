'use client';

import { useEffect, useState } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { Loader2, TrendingUp, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#d946ef', '#ec4899', '#10b981', '#f59e0b', '#94a3b8'];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants: any = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            duration: 0.5,
            ease: "circOut"
        }
    }
};

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
            <div className="flex h-full items-center justify-center bg-background text-white">
                <div className="flex flex-col items-center gap-6">
                    <motion.div
                        animate={{
                            scale: [1, 1.2, 1],
                            rotate: [0, 180, 360],
                            opacity: [0.5, 1, 0.5]
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    >
                        <Loader2 className="text-accent-indigo" size={48} />
                    </motion.div>
                    <p className="text-gray-400 font-medium tracking-[0.2em] uppercase text-xs animate-pulse">Orchestrating Intelligence</p>
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

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex-1 overflow-auto bg-transparent text-white p-8"
        >
            <div className="max-w-[1400px] mx-auto space-y-10">
                {/* Header Stats */}
                <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-4">
                    <div>
                        <h1 className="text-[42px] font-black tracking-tighter leading-none spectral-text mb-2">
                            Live Data
                        </h1>
                        <p className="text-gray-400 font-medium text-sm">Real-time task synchronization across the enterprise architecture.</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="glass-card px-6 py-4 flex items-center gap-4 group cursor-default">
                            <div className="bg-indigo-500/20 p-2.5 rounded-xl group-hover:bg-indigo-500/30 transition-colors">
                                <TrendingUp className="text-accent-indigo" size={24} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em] mb-0.5">Active Tasks</p>
                                <p className="text-3xl font-black leading-none tabular-nums text-glow">{data.ongoing.total}</p>
                            </div>
                        </div>
                        <div className="glass-card px-6 py-4 flex items-center gap-4 group cursor-default">
                            <div className="bg-emerald-500/20 p-2.5 rounded-xl group-hover:bg-emerald-500/30 transition-colors">
                                <CheckCircle className="text-accent-cyan" size={24} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em] mb-0.5">Done Tasks</p>
                                <p className="text-3xl font-black leading-none tabular-nums text-glow">{data.done.total}</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Section 1: Ongoing Portfolio */}
                <div className="space-y-6">
                    <motion.div variants={itemVariants} className="flex items-center gap-3 px-1">
                        <div className="w-1.5 h-6 bg-accent-indigo rounded-full" />
                        <h2 className="text-2xl font-black tracking-tight uppercase">Operational Portfolio</h2>
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Board Distribution */}
                        <motion.div variants={itemVariants} className="glass-card glass-card-hover p-8">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">Active Tasks per Board</h3>
                                <div className="h-1.5 w-1.5 rounded-full bg-accent-indigo animate-pulse" />
                            </div>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={ongoingByBoard}>
                                        <defs>
                                            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
                                                <stop offset="100%" stopColor="#6366f1" stopOpacity={0.3} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                        <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                                        <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#0d0e26', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px', color: '#fff', backdropFilter: 'blur(8px)' }}
                                            itemStyle={{ color: '#fff' }}
                                            labelStyle={{ color: '#fff', fontWeight: 'bold', marginBottom: '4px' }}
                                            cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
                                        />
                                        <Bar dataKey="value" fill="url(#barGradient)" radius={[6, 6, 0, 0]} barSize={45} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>

                        {/* Status Breakdown */}
                        <motion.div variants={itemVariants} className="glass-card glass-card-hover p-8">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">Status Matrix</h3>
                                <div className="h-1.5 w-1.5 rounded-full bg-accent-cyan animate-pulse" />
                            </div>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={ongoingByStatus}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={70}
                                            outerRadius={95}
                                            paddingAngle={8}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {ongoingByStatus.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#0d0e26', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px', color: '#fff', backdropFilter: 'blur(8px)' }}
                                            itemStyle={{ color: '#fff' }}
                                            labelStyle={{ color: '#fff', fontWeight: 'bold', marginBottom: '4px' }}
                                        />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '30px', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>

                        {/* Importance Hierarchy */}
                        <motion.div variants={itemVariants} className="glass-card glass-card-hover p-8">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">Strategic Weight</h3>
                                <div className="h-1.5 w-1.5 rounded-full bg-accent-violet animate-pulse" />
                            </div>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={ongoingByImportance} layout="vertical">
                                        <defs>
                                            <linearGradient id="importanceGradient" x1="0" y1="0" x2="1" y2="0">
                                                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                                <stop offset="100%" stopColor="#d946ef" stopOpacity={1} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                                        <XAxis type="number" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} dy={10} />
                                        <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} width={100} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#0d0e26', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px', color: '#fff', backdropFilter: 'blur(8px)' }}
                                            itemStyle={{ color: '#fff' }}
                                            labelStyle={{ color: '#fff', fontWeight: 'bold', marginBottom: '4px' }}
                                            cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
                                        />
                                        <Bar dataKey="value" fill="url(#importanceGradient)" radius={[0, 6, 6, 0]} barSize={24} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>

                        {/* Task Type Breakdown */}
                        <motion.div variants={itemVariants} className="glass-card glass-card-hover p-8">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">Categorical DNA</h3>
                                <div className="h-1.5 w-1.5 rounded-full bg-accent-magenta animate-pulse" />
                            </div>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={ongoingByType}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={70}
                                            outerRadius={95}
                                            paddingAngle={8}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {ongoingByType.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#0d0e26', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px', color: '#fff', backdropFilter: 'blur(8px)' }}
                                            itemStyle={{ color: '#fff' }}
                                            labelStyle={{ color: '#fff', fontWeight: 'bold', marginBottom: '4px' }}
                                        />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '30px', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Section 2: Done Analytics */}
                <div className="pt-6 space-y-6">
                    <motion.div variants={itemVariants} className="flex items-center gap-3 px-1">
                        <div className="w-1.5 h-6 bg-accent-cyan rounded-full" />
                        <h2 className="text-2xl font-black tracking-tight uppercase">Restoration Feed</h2>
                    </motion.div>

                    <motion.div variants={itemVariants} className="grid grid-cols-1 gap-6">
                        <div className="glass-card glass-card-hover p-8">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">Efficiency per Boards</h3>
                                <div className="h-1.5 w-1.5 rounded-full bg-accent-cyan animate-pulse" />
                            </div>
                            <div className="h-[350px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={doneByBoard}>
                                        <defs>
                                            <linearGradient id="restoredGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#06b6d4" stopOpacity={1} />
                                                <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.3} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                        <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                                        <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#0d0e26', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px', color: '#fff', backdropFilter: 'blur(8px)' }}
                                            itemStyle={{ color: '#fff' }}
                                            labelStyle={{ color: '#fff', fontWeight: 'bold', marginBottom: '4px' }}
                                            cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
                                        />
                                        <Bar dataKey="value" fill="url(#restoredGradient)" radius={[8, 8, 0, 0]} barSize={60} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
}
