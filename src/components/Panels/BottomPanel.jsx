import React, { useState, useRef, useEffect } from 'react';
import AssetBrowser from '../Panels/AssetBrowser';
import { ChevronUp, ChevronDown } from 'lucide-react';

export default function BottomPanel() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [height, setHeight] = useState(250); // Default height
    const [isDragging, setIsDragging] = useState(false);
    const panelRef = useRef(null);
    const minHeight = 150;
    const maxHeight = 600;

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isDragging) return;

            // Calculate new height (mouse moves up = larger panel)
            const rect = panelRef.current.getBoundingClientRect();
            const newHeight = window.innerHeight - e.clientY;

            // Clamp between min and max
            const clampedHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));
            setHeight(clampedHeight);
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };

        if (isDragging) {
            document.body.style.cursor = 'ns-resize';
            document.body.style.userSelect = 'none';
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    const handleResizeStart = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    return (
        <div
            ref={panelRef}
            className="absolute bottom-0 left-0 right-80 bg-gray-800 border-t border-gray-700 transition-all duration-300"
            style={{
                height: isCollapsed ? '40px' : `${height}px`,
                zIndex: 90
            }}
        >
            {/* Resize Handle */}
            {!isCollapsed && (
                <div
                    onMouseDown={handleResizeStart}
                    className="absolute top-0 left-0 right-0 h-1 cursor-ns-resize hover:bg-blue-500 transition-colors group"
                >
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-gray-600 group-hover:bg-blue-500 rounded-full" />
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700 bg-gray-750">
                <div className="flex items-center gap-2">
                    <span className="text-white font-semibold text-sm">Assets</span>
                </div>

                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="p-1 hover:bg-gray-700 rounded transition-colors"
                >
                    {isCollapsed ? (
                        <ChevronUp size={16} className="text-white" />
                    ) : (
                        <ChevronDown size={16} className="text-white" />
                    )}
                </button>
            </div>

            {/* Content */}
            {!isCollapsed && (
                <div className="h-[calc(100%-40px)] overflow-hidden">
                    <AssetBrowser />
                </div>
            )}
        </div>
    );
}