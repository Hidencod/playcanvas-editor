import React, { useState } from 'react';
import { useEditor } from '../../context/EditorContext';

const PRIMITIVES = [
    { value: 'box', label: 'Box' },
    { value: 'sphere', label: 'Sphere' },
    { value: 'cylinder', label: 'Cylinder' },
    { value: 'cone', label: 'Cone' },
    { value: 'capsule', label: 'Capsule' },
    { value: 'plane', label: 'Plane' }
];

export default function ObjectCreator({ entityFactory }) {
    const [isOpen, setIsOpen] = useState(false);
    const { addEntity } = useEditor();

    const handleCreate = (type) => {
        if (entityFactory) {
            const entity = entityFactory.createEntity(type);
            addEntity(entity);
            setIsOpen(false);
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white font-medium transition-colors"
            >
                + Create Object
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute top-full left-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-xl z-20 overflow-hidden">
                        <div className="py-1">
                            {PRIMITIVES.map(primitive => (
                                <button
                                    key={primitive.value}
                                    onClick={() => handleCreate(primitive.value)}
                                    className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 transition-colors"
                                >
                                    {primitive.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}