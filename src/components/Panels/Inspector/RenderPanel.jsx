import React, { useState, useEffect, useRef } from 'react';
import { Eye, Palette } from 'lucide-react';
import { useEditor } from '../../../context/EditorContext';

export default function RenderPanel({ entity }) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [castShadows, setCastShadows] = useState(true);
    const [receiveShadows, setReceiveShadows] = useState(true);
    const [color, setColor] = useState('#ccffff');
    const { pcRef } = useEditor();
    const originalMaterialsRef = useRef(new Map());

    useEffect(() => {
        if (!entity || !entity.render) return;

        setCastShadows(entity.render.castShadows);
        setReceiveShadows(entity.render.receiveShadows);

        // Get the ORIGINAL material, not the highlighted one
        // We need to look for the material without emissive glow
        const meshInstance = entity.render.meshInstances[0];
        if (meshInstance && meshInstance.material) {
            const material = meshInstance.material;

            // Check if this is a highlighted material (has blue emissive)
            const isHighlighted = material.emissive &&
                material.emissive.r === 0.3 &&
                material.emissive.g === 0.5 &&
                material.emissive.b === 1;

            if (isHighlighted) {
                // Store reference to find original later
                // For now, use the diffuse color which should be preserved
            }

            const c = material.diffuse;
            const hex = rgbToHex(c.r, c.g, c.b);
            setColor(hex);
        }
    }, [entity]);

    const rgbToHex = (r, g, b) => {
        const toHex = (n) => {
            const hex = Math.round(n * 255).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    };

    const hexToRgb = (hex) => {
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;
        return { r, g, b };
    };

    const handleColorChange = (newColor) => {
        setColor(newColor);
        if (!entity || !entity.render || !pcRef.current) return;

        const rgb = hexToRgb(newColor);
        const pc = pcRef.current;

        // Update ALL mesh instances (including highlighted ones)
        entity.render.meshInstances.forEach(mi => {
            if (mi.material) {
                // Store if it was highlighted
                const wasHighlighted = mi.material.emissive &&
                    mi.material.emissive.r === 0.3 &&
                    mi.material.emissive.g === 0.5 &&
                    mi.material.emissive.b === 1;

                // Update diffuse color
                mi.material.diffuse = new pc.Color(rgb.r, rgb.g, rgb.b);

                // Preserve highlight if it was there
                if (wasHighlighted) {
                    mi.material.emissive = new pc.Color(0.3, 0.5, 1);
                    mi.material.emissiveIntensity = 0.3;
                }

                mi.material.update();
            }
        });
    };

    const handleCastShadowsChange = (value) => {
        setCastShadows(value);
        if (entity && entity.render) {
            entity.render.castShadows = value;
        }
    };

    const handleReceiveShadowsChange = (value) => {
        setReceiveShadows(value);
        if (entity && entity.render) {
            entity.render.receiveShadows = value;
        }
    };

    if (!entity || !entity.render) {
        return null;
    }

    return (
        <div className="bg-gray-800">
            {/* Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-750 transition-colors"
            >
                <span className="font-semibold flex items-center gap-2">
                    <Eye size={16} />
                    Render
                </span>
                <span className={`transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                    ▶
                </span>
            </button>

            {/* Content */}
            {isExpanded && (
                <div className="px-4 pb-4 space-y-4">
                    {/* Model Type */}
                    <div>
                        <label className="text-xs text-gray-400 mb-2 block">Type</label>
                        <div className="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm">
                            {entity.modelFileName ? (
                                <span className="text-purple-400">Custom Model</span>
                            ) : (
                                <span className="text-blue-400 capitalize">{entity.render.type}</span>
                            )}
                        </div>
                    </div>

                    {/* Model File */}
                    {entity.modelFileName && (
                        <div>
                            <label className="text-xs text-gray-400 mb-2 block">Model File</label>
                            <div className="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-gray-300 font-mono truncate">
                                {entity.modelFileName}
                            </div>
                        </div>
                    )}

                    {/* Color Picker */}
                    {!entity.modelFileName && (
                        <div>
                            <label className="text-xs text-gray-400 mb-2 block flex items-center gap-2">
                                <Palette size={14} />
                                Color
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="color"
                                    value={color}
                                    onChange={(e) => handleColorChange(e.target.value)}
                                    className="w-16 h-10 rounded cursor-pointer border border-gray-600"
                                />
                                <input
                                    type="text"
                                    value={color}
                                    onChange={(e) => handleColorChange(e.target.value)}
                                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm focus:border-blue-500 focus:outline-none font-mono"
                                    placeholder="#FFFFFF"
                                />
                            </div>
                        </div>
                    )}

                    {/* Shadows */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={castShadows}
                                onChange={(e) => handleCastShadowsChange(e.target.checked)}
                                className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-800"
                            />
                            <span className="text-sm">Cast Shadows</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={receiveShadows}
                                onChange={(e) => handleReceiveShadowsChange(e.target.checked)}
                                className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-800"
                            />
                            <span className="text-sm">Receive Shadows</span>
                        </label>
                    </div>
                </div>
            )}
        </div>
    );
}