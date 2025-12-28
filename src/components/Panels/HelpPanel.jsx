import React, { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';

export default function HelpPanel() {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className="absolute bottom-4 left-4">
            {isOpen ? (
                <div className="bg-black/70 rounded-lg p-4 text-white text-sm w-64">
                    <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold">Controls</div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="hover:bg-gray-700 rounded p-1"
                        >
                            <X size={16} />
                        </button>
                    </div>
                    <div className="space-y-1">
                        <div><span className="font-bold">Ctrl+Z</span> - Undo</div>
                        <div><span className="font-bold">Ctrl+Y / Ctrl+Shift+Z</span> - Redo</div>
                        <div><span className="font-bold">1/2/3</span> - Transform modes</div>
                        <div><span className="font-bold">X</span> - Toggle World/Local</div>
                        <div><span className="font-bold">F</span> - Focus selection</div>
                        <div><span className="font-bold">R</span> - Reset camera</div>
                        <div><span className="font-bold">Shift</span> - Snap</div>
                        <div><span className="font-bold">Ctrl</span> - Non-uniform scale</div>
                        <div><span className="font-bold">Drag</span> - Orbit camera</div>
                        <div><span className="font-bold">Wheel</span> - Zoom</div>
                        <div><span className="font-bold">Delete</span> - Remove object</div>
                    </div>
                </div>
            ) : (
                <button
                    onClick={() => setIsOpen(true)}
                    className="bg-black/70 rounded-lg p-3 text-white hover:bg-black/80 transition-colors"
                >
                    <HelpCircle size={24} />
                </button>
            )}
        </div>
    );
}