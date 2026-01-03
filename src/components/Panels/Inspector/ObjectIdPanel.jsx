// components/Panels/Inspector/ObjectIdPanel.jsx

import React, { useState, useEffect } from 'react';
import { Tag } from 'lucide-react';
import { useEditor } from '../../../context/EditorContext';
import { SetObjectIdCommand } from '../../../core/history/commands/SetObjectIdCommand';

export default function ObjectIdPanel({ entity }) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [objectId, setObjectId] = useState('');
    const [inputValue, setInputValue] = useState('');
    const [showTooltip, setShowTooltip] = useState(false);
    const { executeCommand } = useEditor();

    useEffect(() => {
        if (!entity) return;

        // Get current objectId from entity
        const currentId = entity.objectId || '';
        setObjectId(currentId);
        setInputValue(currentId);

        // Poll for changes (catches undo/redo)
        const interval = setInterval(() => {
            const updatedId = entity.objectId || '';
            if (updatedId !== objectId) {
                setObjectId(updatedId);
                setInputValue(updatedId);
            }
        }, 100);

        return () => clearInterval(interval);
    }, [entity, objectId]);

    const handleBlur = () => {
        // Only create command if value actually changed
        if (inputValue !== objectId) {
            const command = new SetObjectIdCommand(
                entity,
                inputValue || null,
                objectId || null
            );
            executeCommand(command);
            // Force update by reading the value from entity
            setTimeout(() => {
                const currentId = entity.objectId || '';
                setObjectId(currentId);
                setInputValue(currentId);
            }, 0);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.target.blur(); // Trigger blur to save
        } else if (e.key === 'Escape') {
            setInputValue(objectId); // Reset to original value
            e.target.blur();
        }
    };

    if (!entity) {
        return null;
    }

    return (
        <div className="bg-gray-800">
            {/* Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-750 transition-colors"
            >
                <span className="font-semibold flex items-center gap-2">
                    <Tag size={16} />
                    Object ID
                </span>
                <span className={`transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                    ▶
                </span>
            </button>

            {/* Content */}
            {isExpanded && (
                <div className="px-4 pb-4">
                    <div className="relative">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onBlur={handleBlur}
                            onKeyDown={handleKeyDown}
                            onMouseEnter={() => setShowTooltip(true)}
                            onMouseLeave={() => setShowTooltip(false)}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm focus:border-blue-500 focus:outline-none font-mono"
                            placeholder="e.g., player_1, enemy_boss"
                        />

                        {/* Tooltip */}
                        {showTooltip && (
                            <div className="absolute left-0 bottom-full mb-2 w-64 bg-gray-900 border border-blue-500 rounded shadow-xl z-50 p-2">
                                <div className="text-xs text-gray-300">
                                    Use this ID to pick and manipulate this object in Construct 3
                                </div>
                                <div className="absolute -bottom-1 left-4 w-2 h-2 bg-gray-900 border-r border-b border-blue-500 transform rotate-45"></div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}