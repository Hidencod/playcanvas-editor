import React from 'react';
import { useEditor } from '../../context/EditorContext';

export default function GizmoControls() {
    const { gizmoMode, setGizmoMode, gizmoHandlerRef } = useEditor();

    const handleGizmoChange = (mode) => {
        setGizmoMode(mode);
        if (gizmoHandlerRef.current) {
            gizmoHandlerRef.current.switch(mode);
        }
    };

    return (
        <div className="bg-black/70 rounded-lg p-2 flex gap-1">
            <button
                onClick={() => handleGizmoChange('translate')}
                className={`px-4 py-2 rounded ${gizmoMode === 'translate' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
                    } text-white font-medium transition-colors`}
            >
                Translate (1)
            </button>
            <button
                onClick={() => handleGizmoChange('rotate')}
                className={`px-4 py-2 rounded ${gizmoMode === 'rotate' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
                    } text-white font-medium transition-colors`}
            >
                Rotate (2)
            </button>
            <button
                onClick={() => handleGizmoChange('scale')}
                className={`px-4 py-2 rounded ${gizmoMode === 'scale' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
                    } text-white font-medium transition-colors`}
            >
                Scale (3)
            </button>
        </div>
    );
}