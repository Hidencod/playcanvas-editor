import React, { useState, useEffect } from 'react';
import { useEditor } from '../../context/EditorContext';
import TransformPanel from './Inspector/TransformPanel';
import RenderPanel from './Inspector/RenderPanel';
import ObjectIdPanel from './Inspector/ObjectIdPanel';
import { Box, Settings } from 'lucide-react';

export default function Inspector() {
    const { selectedEntity, entities, appRef } = useEditor();
    const [entity, setEntity] = useState(null);
    const [entityInfo, setEntityInfo] = useState(null);

    useEffect(() => {
        if (selectedEntity) {
            // First check in main entities
            let entityData = entities.find(e => e.name === selectedEntity);

            // If not found, search recursively in all children
            if (!entityData && appRef.current) {
                const findEntityRecursive = (node) => {
                    if (node.name === selectedEntity) {
                        return node;
                    }
                    if (node.children) {
                        for (const child of node.children) {
                            const found = findEntityRecursive(child);
                            if (found) return found;
                        }
                    }
                    return null;
                };

                entities.forEach(({ entity: root }) => {
                    const found = findEntityRecursive(root);
                    if (found) {
                        entityData = { entity: found, name: found.name };
                    }
                });
            }

            if (entityData) {
                setEntity(entityData.entity);

                // Gather entity info
                const info = {
                    guid: entityData.entity.getGuid(),
                    hasParent: entityData.entity.parent && entityData.entity.parent.name !== 'Root',
                    parentName: entityData.entity.parent?.name,
                    childrenCount: entityData.entity.children?.length || 0,
                    hasRender: !!entityData.entity.render,
                    renderType: entityData.entity.render?.type,
                    meshCount: entityData.entity.render?.meshInstances?.length || 0,
                    objectId: entityData.entity.objectId || null
                };
                setEntityInfo(info);
            } else {
                setEntity(null);
                setEntityInfo(null);
            }
        } else {
            setEntity(null);
            setEntityInfo(null);
        }

        // Poll for objectId changes
        const interval = setInterval(() => {
            if (entity) {
                const currentObjectId = entity.objectId || null;
                if (currentObjectId !== entityInfo?.objectId) {
                    setEntityInfo(prev => prev ? { ...prev, objectId: currentObjectId } : null);
                }
            }
        }, 100);

        return () => clearInterval(interval);
    }, [selectedEntity, entities, appRef, entity, entityInfo?.objectId]);

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
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg truncate">{entity.name}</h3>
                        <div className="flex gap-3 text-xs text-gray-400 mt-1">
                            {entity.modelFileName && (
                                <span className="text-purple-400">Custom Model</span>
                            )}
                            {entityInfo?.hasRender && (
                                <span>Type: {entityInfo.renderType}</span>
                            )}
                            {entityInfo?.childrenCount > 0 && (
                                <span>{entityInfo.childrenCount} children</span>
                            )}
                            {entityInfo?.meshCount > 0 && (
                                <span>{entityInfo.meshCount} meshes</span>
                            )}
                        </div>
                        {entityInfo?.hasParent && (
                            <div className="text-xs text-gray-500 mt-1">
                                Parent: {entityInfo.parentName}
                            </div>
                        )}
                        {entityInfo?.objectId && (
                            <div className="mt-2">
                                <span className="inline-block px-2 py-1 bg-blue-600 text-white text-xs rounded font-mono">
                                    ID: {entityInfo.objectId}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Properties Panels */}
            <div className="divide-y divide-gray-700">
                <ObjectIdPanel entity={entity} />
                <TransformPanel entity={entity} />
                <RenderPanel entity={entity} />
            </div>
        </div>
    );
}