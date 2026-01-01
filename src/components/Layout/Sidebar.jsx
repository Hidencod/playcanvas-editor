import React, { useState } from 'react';
import Hierarchy from '../Panels/Hierarchy';
import Inspector from '../Panels/Inspector';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Sidebar() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [activeTab, setActiveTab] = useState('hierarchy'); // 'hierarchy' or 'inspector'

    return (
        <div
            className={`absolute top-0 right-0 h-full bg-gray-800 border-l border-gray-700 transition-all duration-300 flex ${isCollapsed ? 'w-0' : 'w-80'
                }`}
            style={{ zIndex: 100 }}
        >
            {/* Collapse/Expand Button */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute -left-6 top-1/2 -translate-y-1/2 w-6 h-12 bg-gray-800 border border-gray-700 border-r-0 rounded-l-lg flex items-center justify-center hover:bg-gray-700 transition-colors"
            >
                {isCollapsed ? (
                    <ChevronLeft size={16} className="text-white" />
                ) : (
                    <ChevronRight size={16} className="text-white" />
                )}
            </button>

            {/* Sidebar Content */}
            {!isCollapsed && (
                <div className="flex flex-col w-full h-full">
                    {/* Tabs */}
                    <div className="flex border-b border-gray-700">
                        <button
                            onClick={() => setActiveTab('hierarchy')}
                            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'hierarchy'
                                    ? 'bg-gray-700 text-white border-b-2 border-blue-500'
                                    : 'text-gray-400 hover:text-white hover:bg-gray-750'
                                }`}
                        >
                            Hierarchy
                        </button>
                        <button
                            onClick={() => setActiveTab('inspector')}
                            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'inspector'
                                    ? 'bg-gray-700 text-white border-b-2 border-blue-500'
                                    : 'text-gray-400 hover:text-white hover:bg-gray-750'
                                }`}
                        >
                            Inspector
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="flex-1 overflow-y-auto">
                        {activeTab === 'hierarchy' ? (
                            <Hierarchy />
                        ) : (
                            <Inspector />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}