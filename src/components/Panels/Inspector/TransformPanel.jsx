import React, { useState, useEffect, useRef } from 'react';
import { Move } from 'lucide-react';
import { useEditor } from '../../../context/EditorContext';
import { TransformCommand } from '../../../core/history/commands/TransformCommand';
import DragInput from './DragInput';

export default function TransformPanel({ entity }) {
    const [position, setPosition] = useState({ x: 0, y: 0, z: 0 });
    const [rotation, setRotation] = useState({ x: 0, y: 0, z: 0 });
    const [scale, setScale] = useState({ x: 1, y: 1, z: 1 });

    const [positionStr, setPositionStr] = useState({ x: '0', y: '0', z: '0' });
    const [rotationStr, setRotationStr] = useState({ x: '0', y: '0', z: '0' });
    const [scaleStr, setScaleStr] = useState({ x: '1', y: '1', z: '1' });

    const [isExpanded, setIsExpanded] = useState(true);
    const { gizmoHandlerRef, executeCommand, pcRef } = useEditor();

    // Track drag start values for undo
    const dragStartValues = useRef({
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 }
    });

    useEffect(() => {
        if (!entity) return;

        const updateTransform = () => {
            const pos = entity.getPosition();
            const rot = entity.getEulerAngles();
            const scl = entity.getLocalScale();

            setPosition({ x: pos.x, y: pos.y, z: pos.z });
            setRotation({ x: rot.x, y: rot.y, z: rot.z });
            setScale({ x: scl.x, y: scl.y, z: scl.z });

            const activeElement = document.activeElement;
            if (activeElement?.tagName !== 'INPUT') {
                setPositionStr({
                    x: pos.x.toFixed(3),
                    y: pos.y.toFixed(3),
                    z: pos.z.toFixed(3)
                });
                setRotationStr({
                    x: rot.x.toFixed(3),
                    y: rot.y.toFixed(3),
                    z: rot.z.toFixed(3)
                });
                setScaleStr({
                    x: scl.x.toFixed(3),
                    y: scl.y.toFixed(3),
                    z: scl.z.toFixed(3)
                });
            }
        };

        updateTransform();

        const interval = setInterval(updateTransform, 100);
        return () => clearInterval(interval);
    }, [entity]);

    const updateGizmo = () => {
        if (gizmoHandlerRef.current && gizmoHandlerRef.current._nodes.length > 0) {
            const nodes = [...gizmoHandlerRef.current._nodes];
            const gizmo = gizmoHandlerRef.current.gizmo;
            const coordSpace = gizmo.coordSpace;

            gizmo.detach();
            gizmo.attach(nodes);
            gizmo.coordSpace = coordSpace;
        }
    };

    // Create undo command for transform change
    const createTransformCommand = (transformType, oldValues, newValues) => {
        if (!entity || !pcRef.current) return;

        const pc = pcRef.current;
        const command = new TransformCommand(
            entity,
            transformType,
            {
                position: new pc.Vec3(oldValues.position.x, oldValues.position.y, oldValues.position.z),
                rotation: new pc.Vec3(oldValues.rotation.x, oldValues.rotation.y, oldValues.rotation.z),
                scale: new pc.Vec3(oldValues.scale.x, oldValues.scale.y, oldValues.scale.z)
            },
            {
                position: new pc.Vec3(newValues.position.x, newValues.position.y, newValues.position.z),
                rotation: new pc.Vec3(newValues.rotation.x, newValues.rotation.y, newValues.rotation.z),
                scale: new pc.Vec3(newValues.scale.x, newValues.scale.y, newValues.scale.z)
            }
        );

        executeCommand(command, true); // Skip execute since change already applied
    };

    const handlePositionChange = (axis, value) => {
        setPositionStr({ ...positionStr, [axis]: value });

        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
            const newPos = { ...position, [axis]: numValue };
            setPosition(newPos);
            entity.setPosition(newPos.x, newPos.y, newPos.z);
            updateGizmo();
        }
    };

    const handleRotationChange = (axis, value) => {
        setRotationStr({ ...rotationStr, [axis]: value });

        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
            const newRot = { ...rotation, [axis]: numValue };
            setRotation(newRot);
            entity.setEulerAngles(newRot.x, newRot.y, newRot.z);
            updateGizmo();
        }
    };

    const handleScaleChange = (axis, value) => {
        setScaleStr({ ...scaleStr, [axis]: value });

        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
            const newScale = { ...scale, [axis]: numValue };
            setScale(newScale);
            entity.setLocalScale(newScale.x, newScale.y, newScale.z);
            updateGizmo();
        }
    };

    // Drag handlers for undo
    const handleDragStart = (type) => {
        dragStartValues.current = {
            position: { ...position },
            rotation: { ...rotation },
            scale: { ...scale }
        };
    };

    const handleDragEnd = (type) => {
        // Create undo command with start and end values
        createTransformCommand(
            type === 'position' ? 'translate' : type === 'rotation' ? 'rotate' : 'scale',
            dragStartValues.current,
            {
                position: { ...position },
                rotation: { ...rotation },
                scale: { ...scale }
            }
        );
    };

    const handleFocus = (e) => {
        e.target.select();
    };

    const handleBlur = (type, axis) => {
        if (type === 'position') {
            const val = parseFloat(positionStr[axis]);
            if (isNaN(val)) {
                setPositionStr({ ...positionStr, [axis]: position[axis].toFixed(3) });
            } else {
                setPositionStr({ ...positionStr, [axis]: val.toFixed(3) });
            }
        } else if (type === 'rotation') {
            const val = parseFloat(rotationStr[axis]);
            if (isNaN(val)) {
                setRotationStr({ ...rotationStr, [axis]: rotation[axis].toFixed(3) });
            } else {
                setRotationStr({ ...rotationStr, [axis]: val.toFixed(3) });
            }
        } else if (type === 'scale') {
            const val = parseFloat(scaleStr[axis]);
            if (isNaN(val)) {
                setScaleStr({ ...scaleStr, [axis]: scale[axis].toFixed(3) });
            } else {
                setScaleStr({ ...scaleStr, [axis]: val.toFixed(3) });
            }
        }
    };

    const handleKeyDown = (e, type, axis) => {
        if (e.key === 'Enter') {
            e.target.blur();
        }
        if (e.key === 'Escape') {
            if (type === 'position') {
                setPositionStr({ ...positionStr, [axis]: position[axis].toFixed(3) });
            } else if (type === 'rotation') {
                setRotationStr({ ...rotationStr, [axis]: rotation[axis].toFixed(3) });
            } else if (type === 'scale') {
                setScaleStr({ ...scaleStr, [axis]: scale[axis].toFixed(3) });
            }
            e.target.blur();
        }
    };

    return (
        <div className="bg-gray-800">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-750 transition-colors"
            >
                <span className="font-semibold flex items-center gap-2">
                    <Move size={16} />
                    Transform
                </span>
                <span className={`transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                    ▶
                </span>
            </button>

            {isExpanded && (
                <div className="px-4 pb-4 space-y-4">
                    {/* Position */}
                    <div>
                        <label className="text-xs text-gray-400 mb-2 block">Position</label>
                        <div className="grid grid-cols-3 gap-2">
                            <DragInput
                                label="X"
                                color="red"
                                value={positionStr.x}
                                onChange={(v) => handlePositionChange('x', v)}
                                onFocus={handleFocus}
                                onBlur={() => handleBlur('position', 'x')}
                                onKeyDown={(e) => handleKeyDown(e, 'position', 'x')}
                                onDragStart={() => handleDragStart('position')}
                                onDragEnd={() => handleDragEnd('position')}
                                step={0.1}
                            />
                            <DragInput
                                label="Y"
                                color="green"
                                value={positionStr.y}
                                onChange={(v) => handlePositionChange('y', v)}
                                onFocus={handleFocus}
                                onBlur={() => handleBlur('position', 'y')}
                                onKeyDown={(e) => handleKeyDown(e, 'position', 'y')}
                                onDragStart={() => handleDragStart('position')}
                                onDragEnd={() => handleDragEnd('position')}
                                step={0.1}
                            />
                            <DragInput
                                label="Z"
                                color="blue"
                                value={positionStr.z}
                                onChange={(v) => handlePositionChange('z', v)}
                                onFocus={handleFocus}
                                onBlur={() => handleBlur('position', 'z')}
                                onKeyDown={(e) => handleKeyDown(e, 'position', 'z')}
                                onDragStart={() => handleDragStart('position')}
                                onDragEnd={() => handleDragEnd('position')}
                                step={0.1}
                            />
                        </div>
                    </div>

                    {/* Rotation */}
                    <div>
                        <label className="text-xs text-gray-400 mb-2 block">Rotation</label>
                        <div className="grid grid-cols-3 gap-2">
                            <DragInput
                                label="X"
                                color="red"
                                value={rotationStr.x}
                                onChange={(v) => handleRotationChange('x', v)}
                                onFocus={handleFocus}
                                onBlur={() => handleBlur('rotation', 'x')}
                                onKeyDown={(e) => handleKeyDown(e, 'rotation', 'x')}
                                onDragStart={() => handleDragStart('rotation')}
                                onDragEnd={() => handleDragEnd('rotation')}
                                step={1}
                            />
                            <DragInput
                                label="Y"
                                color="green"
                                value={rotationStr.y}
                                onChange={(v) => handleRotationChange('y', v)}
                                onFocus={handleFocus}
                                onBlur={() => handleBlur('rotation', 'y')}
                                onKeyDown={(e) => handleKeyDown(e, 'rotation', 'y')}
                                onDragStart={() => handleDragStart('rotation')}
                                onDragEnd={() => handleDragEnd('rotation')}
                                step={1}
                            />
                            <DragInput
                                label="Z"
                                color="blue"
                                value={rotationStr.z}
                                onChange={(v) => handleRotationChange('z', v)}
                                onFocus={handleFocus}
                                onBlur={() => handleBlur('rotation', 'z')}
                                onKeyDown={(e) => handleKeyDown(e, 'rotation', 'z')}
                                onDragStart={() => handleDragStart('rotation')}
                                onDragEnd={() => handleDragEnd('rotation')}
                                step={1}
                            />
                        </div>
                    </div>

                    {/* Scale */}
                    <div>
                        <label className="text-xs text-gray-400 mb-2 block">Scale</label>
                        <div className="grid grid-cols-3 gap-2">
                            <DragInput
                                label="X"
                                color="red"
                                value={scaleStr.x}
                                onChange={(v) => handleScaleChange('x', v)}
                                onFocus={handleFocus}
                                onBlur={() => handleBlur('scale', 'x')}
                                onKeyDown={(e) => handleKeyDown(e, 'scale', 'x')}
                                onDragStart={() => handleDragStart('scale')}
                                onDragEnd={() => handleDragEnd('scale')}
                                step={0.1}
                            />
                            <DragInput
                                label="Y"
                                color="green"
                                value={scaleStr.y}
                                onChange={(v) => handleScaleChange('y', v)}
                                onFocus={handleFocus}
                                onBlur={() => handleBlur('scale', 'y')}
                                onKeyDown={(e) => handleKeyDown(e, 'scale', 'y')}
                                onDragStart={() => handleDragStart('scale')}
                                onDragEnd={() => handleDragEnd('scale')}
                                step={0.1}
                            />
                            <DragInput
                                label="Z"
                                color="blue"
                                value={scaleStr.z}
                                onChange={(v) => handleScaleChange('z', v)}
                                onFocus={handleFocus}
                                onBlur={() => handleBlur('scale', 'z')}
                                onKeyDown={(e) => handleKeyDown(e, 'scale', 'z')}
                                onDragStart={() => handleDragStart('scale')}
                                onDragEnd={() => handleDragEnd('scale')}
                                step={0.1}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}