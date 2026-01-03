import React, { useState, useEffect } from 'react';
import { useEditor } from '../../context/EditorContext';
import { DeleteEntityCommand } from '../../core/history/commands/DeleteEntityCommand';
import { Trash2, Box, Cylinder, Circle, ChevronRight, ChevronDown } from 'lucide-react';

const getIconForEntity = (entity) => {
    if (entity.modelFileName) return '📦';
    if (!entity.render) return '📁';
    switch (entity.render?.type) {
        case 'box': return <Box size={16} />;
        case 'sphere': return <Circle size={16} />;
        case 'cylinder': return <Cylinder size={16} />;
        case 'asset': return '🎨';
        default: return <Box size={16} />;
    }
};

function HierarchyItem({
    entity,
    selectedEntity,
    onSelect,
    onDelete,
    expandedItems,
    toggleExpand,
    level = 0,
    canDelete = true
}) {
    const hasChildren = entity.children && entity.children.length > 0;
    const isExpanded = expandedItems.has(entity.getGuid());
    const isSelected = selectedEntity === entity.name;

    return (
        <>
            <div
                onClick={() => onSelect(entity.name, entity)}
                className={`flex items-center justify-between px-3 py-2 rounded cursor-pointer transition-colors group ${isSelected
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-gray-700 text-gray-200'
                    }`}
                style={{ paddingLeft: `${level * 16 + 12}px` }}
            >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    {hasChildren ? (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleExpand(entity.getGuid());
                            }}
                            className="p-0.5 hover:bg-gray-600 rounded flex-shrink-0"
                        >
                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                    ) : (
                        <span className="w-5 flex-shrink-0" />
                    )}
                    <span className="text-gray-400 flex-shrink-0">
                        {getIconForEntity(entity)}
                    </span>
                    <span className="font-medium truncate text-sm">{entity.name}</span>
                    {entity.objectId && (
                        <span className="ml-2 px-1.5 py-0.5 bg-blue-600 text-white text-xs rounded font-mono flex-shrink-0">
                            {entity.objectId}
                        </span>
                    )}
                </div>
                {canDelete && (
                    <button
                        onClick={(e) => onDelete(entity.name, e)}
                        className={`p-1 rounded transition-colors flex-shrink-0 ${isSelected
                            ? 'hover:bg-red-600'
                            : 'opacity-0 group-hover:opacity-100 hover:bg-red-600'
                            }`}
                        title="Delete object"
                    >
                        <Trash2 size={14} />
                    </button>
                )}
            </div>

            {hasChildren && isExpanded && (
                <>
                    {entity.children.map((child) => (
                        <HierarchyItem
                            key={child.getGuid()}
                            entity={child}
                            selectedEntity={selectedEntity}
                            onSelect={onSelect}
                            onDelete={onDelete}
                            expandedItems={expandedItems}
                            toggleExpand={toggleExpand}
                            level={level + 1}
                            canDelete={true}
                        />
                    ))}
                </>
            )}
        </>
    );
}

export default function Hierarchy() {
    const {
        entities,
        selectedEntity,
        executeCommand,
        addEntity,
        removeEntity,
        selectorRef,
        appRef
    } = useEditor();

    const [expandedItems, setExpandedItems] = useState(new Set());
    const [draggedEntity, setDraggedEntity] = useState(null);
    const [sceneEntities, setSceneEntities] = useState([]);

    // Filter out gizmo entities
    const isGizmoEntity = (entity) => {
        // Filter out gizmo-related entities by name or tags
        const gizmoNames = ['gizmo', 'axis', 'ring', 'arrow', 'box-line', 'rotate', 'scale', 'translate'];
        const entityName = entity.name?.toLowerCase() || '';

        // Check if entity name contains gizmo-related terms
        // Note: We removed 'plane' from this list because users can create plane entities
        if (gizmoNames.some(name => entityName.includes(name))) {
            return true;
        }

        // Check if entity has gizmo tags
        if (entity.tags && (entity.tags.has('gizmo') || entity.tags.has('ignore-hierarchy'))) {
            return true;
        }

        // Check if entity is part of GizmoLayer
        if (entity.layers && entity.layers.includes('GizmoLayer')) {
            return true;
        }

        return false;
    };

    // Collect all entities from scene, excluding gizmos and system entities
    useEffect(() => {
        if (!appRef.current) return;

        const collectEntities = () => {
            const collected = [];
            const app = appRef.current;

            // Get all root children
            if (app.root && app.root.children) {
                app.root.children.forEach(child => {
                    // Skip camera, light, and gizmo entities
                    if (child.name === 'camera' ||
                        child.name === 'light' ||
                        isGizmoEntity(child)) {
                        return;
                    }
                    collected.push(child);
                });
            }

            return collected;
        };

        const updateEntities = () => {
            const collected = collectEntities();
            setSceneEntities(collected);
        };

        updateEntities();

        // Update every 100ms to catch changes including objectId updates
        const interval = setInterval(updateEntities, 100);

        return () => clearInterval(interval);
    }, [appRef, entities]);

    const handleSelect = (entityName, entityObj) => {
        if (selectorRef.current && entityObj) {
            selectorRef.current.fire('select', entityObj, true);
        }
    };

    const handleDelete = (entityName, e) => {
        e.stopPropagation();

        // Find entity in scene
        const entityToDelete = sceneEntities.find(e => e.name === entityName);

        if (entityToDelete) {
            const command = new DeleteEntityCommand(
                entityToDelete,
                addEntity,
                removeEntity
            );
            executeCommand(command);
        }
    };

    const toggleExpand = (guid) => {
        setExpandedItems(prev => {
            const next = new Set(prev);
            if (next.has(guid)) {
                next.delete(guid);
            } else {
                next.add(guid);
            }
            return next;
        });
    };

    // Drag and Drop handlers
    const handleDragStart = (e, entity) => {
        setDraggedEntity(entity);
        e.dataTransfer.effectAllowed = 'move';
        e.stopPropagation();
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e, targetEntity) => {
        e.preventDefault();
        e.stopPropagation();

        if (!draggedEntity || !targetEntity || draggedEntity === targetEntity) {
            setDraggedEntity(null);
            return;
        }

        // Don't allow dropping parent into child
        let parent = targetEntity.parent;
        while (parent) {
            if (parent === draggedEntity) {
                console.warn('Cannot drop parent into its own child');
                setDraggedEntity(null);
                return;
            }
            parent = parent.parent;
        }

        // Reparent the entity
        if (draggedEntity.parent) {
            draggedEntity.parent.removeChild(draggedEntity);
        }
        targetEntity.addChild(draggedEntity);

        // Expand the target to show the new child
        setExpandedItems(prev => new Set([...prev, targetEntity.getGuid()]));

        setDraggedEntity(null);
    };

    // Count all entities including children
    const countAllEntities = (entities) => {
        let count = 0;
        const traverse = (entity) => {
            count++;
            if (entity.children) {
                entity.children.forEach(child => traverse(child));
            }
        };
        entities.forEach(entity => traverse(entity));
        return count;
    };

    const totalCount = countAllEntities(sceneEntities);

    // Auto-expand entities with children on first load
    useEffect(() => {
        if (sceneEntities.length > 0 && expandedItems.size === 0) {
            const toExpand = new Set();
            sceneEntities.forEach((entity) => {
                if (entity.children && entity.children.length > 0) {
                    toExpand.add(entity.getGuid());
                }
            });
            if (toExpand.size > 0) {
                setExpandedItems(toExpand);
            }
        }
    }, [sceneEntities.length]);

    return (
        <div className="p-4 h-full flex flex-col">
            <div className="text-white flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-3 flex-shrink-0">
                    <div className="text-xs text-gray-400 uppercase tracking-wider">
                        Scene Objects ({totalCount})
                    </div>
                    {totalCount > 0 && (
                        <button
                            onClick={() => {
                                // Expand all
                                const allGuids = new Set();
                                const traverse = (entity) => {
                                    if (entity.children && entity.children.length > 0) {
                                        allGuids.add(entity.getGuid());
                                        entity.children.forEach(child => traverse(child));
                                    }
                                };
                                sceneEntities.forEach(entity => traverse(entity));
                                setExpandedItems(allGuids);
                            }}
                            className="text-xs text-blue-400 hover:text-blue-300"
                        >
                            Expand All
                        </button>
                    )}
                </div>
                {sceneEntities.length === 0 ? (
                    <div className="text-gray-500 text-sm text-center py-8">
                        No objects in scene
                    </div>
                ) : (
                    <div className="space-y-1 overflow-auto flex-1">
                        {sceneEntities.map((entity) => (
                            <div
                                key={entity.getGuid()}
                                draggable
                                onDragStart={(e) => handleDragStart(e, entity)}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, entity)}
                            >
                                <HierarchyItem
                                    entity={entity}
                                    selectedEntity={selectedEntity}
                                    onSelect={handleSelect}
                                    onDelete={handleDelete}
                                    expandedItems={expandedItems}
                                    toggleExpand={toggleExpand}
                                    level={0}
                                    canDelete={true}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}