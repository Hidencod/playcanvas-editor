import React, { useState, useRef, useEffect } from 'react';
import Hierarchy from '../Panels/Hierarchy';
import Inspector from '../Panels/Inspector';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Sidebar() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [activeTab, setActiveTab] = useState('hierarchy');
    const [width, setWidth] = useState(320); // Default 320px (80 * 4)
    const [isResizing, setIsResizing] = useState(false);
    const sidebarRef = useRef(null);

    const minWidth = 240; // Minimum width (60 * 4)
    const maxWidth = 600; // Maximum width (150 * 4)

    const handleMouseDown = (e) => {
        e.preventDefault();
        setIsResizing(true);
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isResizing) return;

            const newWidth = window.innerWidth - e.clientX;

            if (newWidth >= minWidth && newWidth <= maxWidth) {
                setWidth(newWidth);
            }
        };

        const handleMouseUp = () => {
            setIsResizing(false);
        };

        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'ew-resize';
            document.body.style.userSelect = 'none';
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
    }, [isResizing]);

    return (
        <div
            ref={sidebarRef}
            className={`absolute top-0 right-0 h-full bg-gray-800 border-l border-gray-700 transition-all duration-300 flex ${isCollapsed ? 'w-0' : ''
                }`}
            style={{
                zIndex: 100,
                width: isCollapsed ? 0 : `${width}px`
            }}
        >
            {/* Resize Handle */}
            {!isCollapsed && (
                <div
                    onMouseDown={handleMouseDown}
                    className="absolute left-0 top-0 w-1 h-full cursor-ew-resize hover:bg-blue-500 transition-colors group"
                    style={{ zIndex: 101 }}
                >
                    <div className="absolute left-0 top-0 w-1 h-full bg-transparent group-hover:bg-blue-500" />
                </div>
            )}

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
                    <div className="flex border-b border-gray-700 flex-shrink-0">
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
                    <div className="flex-1 overflow-hidden">
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