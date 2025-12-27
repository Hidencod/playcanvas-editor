import React, { useState } from 'react';
import { useEditor } from '../../context/EditorContext';
import PlayCanvasCanvas from '../Canvas/PlayCanvasCanvas';
import Toolbar from '../Toolbar/Toolbar';
import Hierarchy from '../Panels/Hierarchy';
import HelpPanel from '../Panels/HelpPanel';

export default function EditorLayout() {
    const { isLoading } = useEditor();
    const [entityFactory, setEntityFactory] = useState(null);

    return (
        <div className="w-full h-screen relative bg-gray-900">
            <PlayCanvasCanvas onReady={setEntityFactory} />

            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                    <div className="text-white text-xl">Loading PlayCanvas Editor...</div>
                </div>
            )}

            <Toolbar entityFactory={entityFactory} />
            <Hierarchy />
            <HelpPanel />
        </div>
    );
}