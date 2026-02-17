'use client';

import { useState } from 'react';
import { LayoutGrid, Columns, Calendar as CalendarIcon, GanttChart, BarChart3, Map, FileText, Files, Plus } from 'lucide-react';
import type { ViewType, BoardView } from '@/lib/types';

interface ViewSwitcherProps {
    views: BoardView[];
    currentViewId?: string;
    onViewChange: (viewId: string) => void;
    onCreateView?: () => void;
}

const VIEW_ICONS: Record<ViewType, React.ReactNode> = {
    table: <LayoutGrid size={16} />,
    kanban: <Columns size={16} />,
    calendar: <CalendarIcon size={16} />,
    timeline: <GanttChart size={16} />,
    chart: <BarChart3 size={16} />,
    map: <Map size={16} />,
    form: <FileText size={16} />,
    files: <Files size={16} />
};

export default function ViewSwitcher({ views, currentViewId, onViewChange, onCreateView }: ViewSwitcherProps) {
    const [showDropdown, setShowDropdown] = useState(false);

    const currentView = views.find(v => v.id === currentViewId) || views.find(v => v.isDefault) || views[0];

    return (
        <div className="relative">
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 px-4 py-2 bg-[#1a1b4b] hover:bg-[#2c2d65] text-white rounded-lg transition-colors border border-[#2c2d65]"
            >
                {currentView && VIEW_ICONS[currentView.type as ViewType]}
                <span className="font-medium text-sm">{currentView?.name || 'Main Table'}</span>
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {showDropdown && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowDropdown(false)}
                    />
                    <div className="absolute left-0 top-full mt-2 w-64 bg-[#1a1b4b] border border-[#2c2d65] rounded-lg shadow-2xl z-50 overflow-hidden">
                        <div className="p-2 border-b border-[#2c2d65]">
                            <div className="text-xs font-semibold text-gray-400 uppercase px-2 py-1">Views</div>
                        </div>

                        <div className="max-h-96 overflow-y-auto">
                            {views.map(view => (
                                <button
                                    key={view.id}
                                    onClick={() => {
                                        onViewChange(view.id);
                                        setShowDropdown(false);
                                    }}
                                    className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[#2c2d65] transition-colors ${view.id === currentViewId ? 'bg-[#2c2d65]' : ''
                                        }`}
                                >
                                    <span className={view.id === currentViewId ? 'text-[#e0592a]' : 'text-gray-400'}>
                                        {VIEW_ICONS[view.type as ViewType]}
                                    </span>
                                    <div className="flex-1">
                                        <div className={`text-sm font-medium ${view.id === currentViewId ? 'text-white' : 'text-gray-300'
                                            }`}>
                                            {view.name}
                                        </div>
                                        {view.isDefault && (
                                            <div className="text-xs text-gray-500">Default view</div>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>

                        {onCreateView && (
                            <>
                                <div className="border-t border-[#2c2d65]" />
                                <button
                                    onClick={() => {
                                        onCreateView();
                                        setShowDropdown(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[#2c2d65] transition-colors text-[#e0592a]"
                                >
                                    <Plus size={16} />
                                    <span className="text-sm font-medium">Add View</span>
                                </button>
                            </>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
