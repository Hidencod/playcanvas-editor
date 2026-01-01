import React, { useState, useEffect } from 'react';
import { useEditor } from '../../context/EditorContext';
import TransformPanel from './Inspector/TransformPanel';
import RenderPanel from './Inspector/RenderPanel';
import { Box, Settings } from 'lucide-react';

export default function Inspector() {
    const { selectedEntity, entities, appRef } = useEditor();
    const [entity, setEntity] = useState(null);

    useEffect(() => {
        if (selectedEntity) {
            const entityData = entities.find(e => e.name === selectedEntity);
            setEntity(entityData?.entity || null);
        } else {
            setEntity(null);
        }
    }, [selectedEntity, entities]);

    if (!entity) {
        return (
            <div className="p-6 text-center text-gray-400">
                <Settings size={48} className="mx-auto mb-4 opacity-50" />
                <p>No object selected</p>
                <p className="text-sm mt-2">Select an object to view properties</p>
            </div>
        );
    }

    return (
        <div className="text-white">
            {/* Entity Header */}
            <div className="p-4 bg-gray-750 border-b border-gray-700">
                <div className="flex items-center gap-3">
                    <Box size={24} className="text-blue-400" />
                    <div>
                        <h3 className="font-semibold text-lg">{entity.name}</h3>
                        <p className="text-xs text-gray-400">
                            {entity.modelFileName ? 'Custom Model' : entity.render?.type || 'Entity'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Properties Panels */}
            <div className="divide-y divide-gray-700">
                <TransformPanel entity={entity} />
                <RenderPanel entity={entity} />
            </div>
        </div>
    );
}