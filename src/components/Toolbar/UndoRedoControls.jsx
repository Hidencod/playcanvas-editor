import React from 'react';
import { useEditor } from '../../context/EditorContext';
import { Undo, Redo } from 'lucide-react';

export default function UndoRedoControls() {
    const { undo, redo, canUndo, canRedo } = useEditor();

    return (
        <div className="bg-black/70 rounded-lg p-2 flex gap-1">
            <button
                onClick={undo}
                disabled={!canUndo}
                className="px-3 py-2 rounded bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:opacity-50 text-white font-medium transition-colors flex items-center gap-2"
                title="Undo (Ctrl+Z)"
            >
                <Undo size={18} />
                Undo
            </button>
            <button
                onClick={redo}
                disabled={!canRedo}
                className="px-3 py-2 rounded bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:opacity-50 text-white font-medium transition-colors flex items-center gap-2"
                title="Redo (Ctrl+Y)"
            >
                <Redo size={18} />
                Redo
            </button>
        </div>
    );
}