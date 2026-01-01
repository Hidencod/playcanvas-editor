import React from 'react';
import { useEditor } from '../../context/EditorContext';
import { DeleteEntityCommand } from '../../core/history/commands/DeleteEntityCommand';
import { Trash2, Box, Cylinder, Circle } from 'lucide-react';

const getIconForEntity = (entity) => {
    if (entity.modelFileName) return '📦';
    switch (entity.render?.type) {
        case 'box': return <Box size={16} />;
        case 'sphere': return <Circle size={16} />;
        case 'cylinder': return <Cylinder size={16} />;
        default: return <Box size={16} />;
    }
};

export default function Hierarchy() {
    const {
        entities,
        selectedEntity,
        executeCommand,
        addEntity,
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
        const entityObj = entities.find(e => e.name === entityName);
        if (entityObj) {
            const command = new DeleteEntityCommand(
                entityObj.entity,
                addEntity,
                removeEntity
            );
            executeCommand(command);
        }
    };

    return (
        <div className="p-4">
            <div className="text-white">
                <div className="text-xs text-gray-400 mb-3 uppercase tracking-wider">
                    Scene Objects ({entities.length})
                </div>
                {entities.length === 0 ? (
                    <div className="text-gray-500 text-sm text-center py-8">
                        No objects in scene
                    </div>
                ) : (
                    <div className="space-y-1">
                        {entities.map(({ name, entity }) => (
                            <div
                                key={name}
                                onClick={() => handleSelect(name, entity)}
                                className={`flex items-center justify-between px-3 py-2 rounded cursor-pointer transition-colors group ${selectedEntity === name
                                        ? 'bg-blue-600 text-white'
                                        : 'hover:bg-gray-700 text-gray-200'
                                    }`}
                            >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <span className="text-gray-400 flex-shrink-0">
                                        {getIconForEntity(entity)}
                                    </span>
                                    <span className="font-medium truncate">{name}</span>
                                </div>
                                <button
                                    onClick={(e) => handleDelete(name, e)}
                                    className={`p-1 rounded transition-colors flex-shrink-0 ${selectedEntity === name
                                            ? 'hover:bg-red-600'
                                            : 'opacity-0 group-hover:opacity-100 hover:bg-red-600'
                                        }`}
                                    title="Delete object"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}