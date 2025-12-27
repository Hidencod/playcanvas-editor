import React from 'react';
import GizmoControls from './GizmoControls';
import CameraControls from './CameraControls';
import ObjectCreator from './ObjectCreator';

export default function Toolbar({ entityFactory }) {
    return (
        <div className="absolute top-4 left-4 flex gap-2 z-10">
            <ObjectCreator entityFactory={entityFactory} />
            <GizmoControls />
            <CameraControls />
        </div>
    );
}