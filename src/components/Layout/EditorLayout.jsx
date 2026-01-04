import React, { useState } from 'react';
import { useEditor } from '../../context/EditorContext';
import PlayCanvasCanvas from '../Canvas/PlayCanvasCanvas';
import Toolbar from '../Toolbar/Toolbar';
import Sidebar from './Sidebar';
import HelpPanel from '../Panels/HelpPanel';
import BottomPanel from '../Panels/BottomPanel';
import AutoSaveManager from '../AutoSave/AutoSaveManager';

export default function EditorLayout() {
    const { isLoading } = useEditor();
    const [entityFactory, setEntityFactory] = useState(null);
    const [modelLoader, setModelLoader] = useState(null);

    const handleReady = (factory, loader) => {
        setEntityFactory(factory);
        setModelLoader(loader);
    };

    return (
        <div className="w-full h-screen relative bg-gray-900 flex">
            {/* Main Canvas Area */}
            <div className="flex-1 relative">
                <PlayCanvasCanvas onReady={handleReady} />

                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-50">
                        <div className="text-white text-xl">Loading PlayCanvas Editor...</div>
                    </div>
                )}

                <Toolbar entityFactory={entityFactory} modelLoader={modelLoader} />
                
                <HelpPanel />

                

                {/* Bottom Panel */}
                <BottomPanel />
                {/* Auto-Save Manager */}
                <AutoSaveManager />
            </div>

            {/* Sidebar */}
            <Sidebar />

            {/* Global styles for animations */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes fade-in {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out;
                }
            `}} />
        </div>
    );
}