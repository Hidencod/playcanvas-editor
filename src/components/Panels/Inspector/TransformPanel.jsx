import React, { useState, useEffect } from 'react';
import { Move } from 'lucide-react';
import { useEditor } from '../../../context/EditorContext';

export default function TransformPanel({ entity }) {
    const [position, setPosition] = useState({ x: 0, y: 0, z: 0 });
    const [rotation, setRotation] = useState({ x: 0, y: 0, z: 0 });
    const [scale, setScale] = useState({ x: 1, y: 1, z: 1 });
    const [isExpanded, setIsExpanded] = useState(true);
    const { gizmoHandlerRef } = useEditor(); // Add this

    useEffect(() => {
        if (!entity) return;

        const updateTransform = () => {
            const pos = entity.getPosition();
            const rot = entity.getEulerAngles();
            const scl = entity.getLocalScale();

            setPosition({ x: pos.x, y: pos.y, z: pos.z });
            setRotation({ x: rot.x, y: rot.y, z: rot.z });
            setScale({ x: scl.x, y: scl.y, z: scl.z });
        };

        updateTransform();

        // Update on changes
        const interval = setInterval(updateTransform, 100);
        return () => clearInterval(interval);
    }, [entity]);

    const updateGizmo = () => {
        // Force gizmo to update its position
        if (gizmoHandlerRef.current && gizmoHandlerRef.current._nodes.length > 0) {
            const nodes = [...gizmoHandlerRef.current._nodes];
            const gizmo = gizmoHandlerRef.current.gizmo;
            const coordSpace = gizmo.coordSpace;

            // Detach and reattach to force position update
            gizmo.detach();
            gizmo.attach(nodes);
            gizmo.coordSpace = coordSpace;
        }
    };

    const handlePositionChange = (axis, value) => {
        const newPos = { ...position, [axis]: parseFloat(value) || 0 };
        setPosition(newPos);
        entity.setPosition(newPos.x, newPos.y, newPos.z);
        updateGizmo(); // Add this
    };

    const handleRotationChange = (axis, value) => {
        const newRot = { ...rotation, [axis]: parseFloat(value) || 0 };
        setRotation(newRot);
        entity.setEulerAngles(newRot.x, newRot.y, newRot.z);
        updateGizmo(); // Add this
    };

    const handleScaleChange = (axis, value) => {
        const newScale = { ...scale, [axis]: parseFloat(value) || 1 };
        setScale(newScale);
        entity.setLocalScale(newScale.x, newScale.y, newScale.z);
        updateGizmo(); // Add this
    };

    return (
        <div className="bg-gray-800">
            {/* Header */}
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

            {/* Content */}
            {isExpanded && (
                <div className="px-4 pb-4 space-y-4">
                    {/* Position */}
                    <div>
                        <label className="text-xs text-gray-400 mb-2 block">Position</label>
                        <div className="grid grid-cols-3 gap-2">
                            <div>
                                <label className="text-xs text-red-400 block mb-1">X</label>
                                <input
                                    type="number"
                                    value={position.x.toFixed(2)}
                                    onChange={(e) => handlePositionChange('x', e.target.value)}
                                    className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm focus:border-red-500 focus:outline-none"
                                    step="0.1"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-green-400 block mb-1">Y</label>
                                <input
                                    type="number"
                                    value={position.y.toFixed(2)}
                                    onChange={(e) => handlePositionChange('y', e.target.value)}
                                    className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm focus:border-green-500 focus:outline-none"
                                    step="0.1"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-blue-400 block mb-1">Z</label>
                                <input
                                    type="number"
                                    value={position.z.toFixed(2)}
                                    onChange={(e) => handlePositionChange('z', e.target.value)}
                                    className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm focus:border-blue-500 focus:outline-none"
                                    step="0.1"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Rotation */}
                    <div>
                        <label className="text-xs text-gray-400 mb-2 block">Rotation</label>
                        <div className="grid grid-cols-3 gap-2">
                            <div>
                                <label className="text-xs text-red-400 block mb-1">X</label>
                                <input
                                    type="number"
                                    value={rotation.x.toFixed(2)}
                                    onChange={(e) => handleRotationChange('x', e.target.value)}
                                    className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm focus:border-red-500 focus:outline-none"
                                    step="1"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-green-400 block mb-1">Y</label>
                                <input
                                    type="number"
                                    value={rotation.y.toFixed(2)}
                                    onChange={(e) => handleRotationChange('y', e.target.value)}
                                    className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm focus:border-green-500 focus:outline-none"
                                    step="1"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-blue-400 block mb-1">Z</label>
                                <input
                                    type="number"
                                    value={rotation.z.toFixed(2)}
                                    onChange={(e) => handleRotationChange('z', e.target.value)}
                                    className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm focus:border-blue-500 focus:outline-none"
                                    step="1"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Scale */}
                    <div>
                        <label className="text-xs text-gray-400 mb-2 block">Scale</label>
                        <div className="grid grid-cols-3 gap-2">
                            <div>
                                <label className="text-xs text-red-400 block mb-1">X</label>
                                <input
                                    type="number"
                                    value={scale.x.toFixed(2)}
                                    onChange={(e) => handleScaleChange('x', e.target.value)}
                                    className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm focus:border-red-500 focus:outline-none"
                                    step="0.1"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-green-400 block mb-1">Y</label>
                                <input
                                    type="number"
                                    value={scale.y.toFixed(2)}
                                    onChange={(e) => handleScaleChange('y', e.target.value)}
                                    className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm focus:border-green-500 focus:outline-none"
                                    step="0.1"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-blue-400 block mb-1">Z</label>
                                <input
                                    type="number"
                                    value={scale.z.toFixed(2)}
                                    onChange={(e) => handleScaleChange('z', e.target.value)}
                                    className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm focus:border-blue-500 focus:outline-none"
                                    step="0.1"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}