import React from 'react';
import { useEditor } from '../../context/EditorContext';

export default function CameraControls() {
    const {
        coordSpace,
        setCoordSpace,
        gizmoHandlerRef,
        selectedEntity,
        cameraControllerRef,
        appRef,
        pcRef
    } = useEditor();

    const handleCoordSpaceToggle = () => {
        const newSpace = coordSpace === 'world' ? 'local' : 'world';
        setCoordSpace(newSpace);
        if (gizmoHandlerRef.current) {
            gizmoHandlerRef.current.gizmo.coordSpace = newSpace;
        }
    };

    const handleFocus = () => {
        if (selectedEntity && cameraControllerRef.current && gizmoHandlerRef.current && pcRef.current) {
            const point = gizmoHandlerRef.current.gizmo.root.getPosition();
            const camera = appRef.current.root.findByName('camera');
            const pc = pcRef.current;
            const tmpV1 = new pc.Vec3();
            const start = tmpV1.copy(camera.forward).mulScalar(-8).add(point);
            cameraControllerRef.current.reset(point, start);
        }
    };

    const handleReset = () => {
        if (cameraControllerRef.current && pcRef.current) {
            const pc = pcRef.current;
            cameraControllerRef.current.focus(new pc.Vec3(0, 0, 0));
        }
    };

    return (
        <>
            <div className="bg-black/70 rounded-lg p-2 flex gap-1">
                <button
                    onClick={handleCoordSpaceToggle}
                    className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white font-medium transition-colors"
                >
                    {coordSpace === 'world' ? 'World (X)' : 'Local (X)'}
                </button>
            </div>

            <div className="bg-black/70 rounded-lg p-2 flex gap-1">
                <button
                    onClick={handleFocus}
                    disabled={!selectedEntity}
                    className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:opacity-50 text-white font-medium transition-colors"
                >
                    Focus (F)
                </button>
                <button
                    onClick={handleReset}
                    className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white font-medium transition-colors"
                >
                    Reset (R)
                </button>
            </div>
        </>
    );
}