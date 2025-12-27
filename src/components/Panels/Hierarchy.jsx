import React from 'react';
import { useEditor } from '../../context/EditorContext';
import { Trash2 } from 'lucide-react';

export default function Hierarchy() {
    const {
        entities,
        selectedEntity,
        setSelectedEntity,
        removeEntity,
        selectorRef
    } = useEditor();

    const handleSelect = (entityName, entityObj) => {
        if (selectorRef.current && entityObj) {
            selectorRef.current.fire('select', entityObj, true);
        }
    };

    const handleDelete = (entityName, e) => {
        e.stopPropagation();
        removeEntity(entityName);
    };

    return (
        <div className="absolute top-4 right-4 w-64 bg-black/70 rounded-lg p-4 text-white max-h-96 overflow-y-auto">
            <div className="font-semibold mb-3 text-lg">Scene Hierarchy</div>
            {entities.length === 0 ? (
                <div className="text-gray-400 text-sm">No objects in scene</div>
            ) : (
                <div className="space-y-1">
                    {entities.map(({ name, entity }) => (
                        <div
                            key={name}
                            onClick={() => handleSelect(name, entity)}
                            className={`flex items-center justify-between px-3 py-2 rounded cursor-pointer transition-colors ${selectedEntity === name
                                    ? 'bg-blue-600'
                                    : 'hover:bg-gray-700'
                                }`}
                        >
                            <span className="font-medium">{name}</span>
                            <button
                                onClick={(e) => handleDelete(name, e)}
                                className="p-1 hover:bg-red-600 rounded transition-colors"
                                title="Delete object"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}