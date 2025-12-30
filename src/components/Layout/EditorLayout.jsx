import React, { useState } from 'react';
import { useEditor } from '../../context/EditorContext';
import PlayCanvasCanvas from '../Canvas/PlayCanvasCanvas';
import Toolbar from '../Toolbar/Toolbar';
import Hierarchy from '../Panels/Hierarchy';
import HelpPanel from '../Panels/HelpPanel';

export default function EditorLayout() {
    const { isLoading } = useEditor();
    const [entityFactory, setEntityFactory] = useState(null);
    const [modelLoader, setModelLoader] = useState(null);

    const handleReady = (factory, loader) => {
        setEntityFactory(factory);
        setModelLoader(loader);
    };

    return (
        <div className="w-full h-screen relative bg-gray-900">
            <PlayCanvasCanvas onReady={handleReady} />

            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-50">
                    <div className="text-white text-xl">Loading PlayCanvas Editor...</div>
                </div>
            )}

            <Toolbar entityFactory={entityFactory} modelLoader={modelLoader} />
            <Hierarchy />
            <HelpPanel />
        </div>
    );
}