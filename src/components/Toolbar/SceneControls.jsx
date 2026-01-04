import React, { useRef, useState } from 'react';
import { useEditor } from '../../context/EditorContext';
import { Download, Upload, FileJson } from 'lucide-react';

export default function SceneControls() {
    const {
        entities,
        sceneSerializerRef,
        addEntity,
        clearScene,
        assetManagerRef
    } = useEditor();

    const [isExportOpen, setIsExportOpen] = useState(false);
    const [filename, setFilename] = useState('scene.json');
    const fileInputRef = useRef(null);

    const handleExport = () => {
        if (sceneSerializerRef.current) {
            sceneSerializerRef.current.exportToFile(entities, filename);
            setIsExportOpen(false);
        }
    };

    const handleImport = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file || !sceneSerializerRef.current) return;

        try {
            // Make sure assetManager is passed to serializer
            if (assetManagerRef?.current && !sceneSerializerRef.current.assetManager) {
                sceneSerializerRef.current.assetManager = assetManagerRef.current;
            }

            const entityFactory = sceneSerializerRef.current.entityFactory;

            // Ask user if they want to clear the scene first
            const shouldClear = window.confirm(
                'Do you want to clear the current scene before importing?'
            );

            if (shouldClear) {
                clearScene();
            }

            await sceneSerializerRef.current.importFromFile(
                file,
                entityFactory,
                addEntity
            );

            alert('Scene imported successfully!');
        } catch (error) {
            console.error('Import failed:', error);
            alert('Failed to import scene: ' + error.message);
        }

        // Reset file input
        e.target.value = '';
    };

    return (
        <div className="relative">
            <div className="bg-black/70 rounded-lg p-2 flex gap-1">
                <button
                    onClick={() => setIsExportOpen(true)}
                    className="px-3 py-2 rounded bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors flex items-center gap-2"
                    title="Export Scene"
                >
                    <Upload size={18} />
                    Export
                </button>

                <button
                    onClick={handleImport}
                    className="px-3 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors flex items-center gap-2"
                    title="Import Scene"
                >
                    <Download size={18} />
                    Import
                </button>
            </div>

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
            />

            {/* Export Dialog */}
            {isExportOpen && (
                <>
                    <div
                        className="fixed inset-0 bg-black/50 z-40"
                        onClick={() => setIsExportOpen(false)}
                    />
                    <div className="absolute top-full left-0 mt-2 w-80 bg-gray-800 rounded-lg shadow-xl z-50 p-4">
                        <div className="flex items-center gap-2 mb-4">
                            <FileJson size={24} className="text-purple-400" />
                            <h3 className="text-white font-semibold">Export Scene</h3>
                        </div>

                        <div className="mb-4">
                            <label className="text-white text-sm mb-2 block">Filename:</label>
                            <input
                                type="text"
                                value={filename}
                                onChange={(e) => setFilename(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-purple-500 focus:outline-none"
                                placeholder="scene.json"
                            />
                        </div>

                        <div className="text-gray-400 text-xs mb-4">
                            Exporting {entities.length} object(s)
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={handleExport}
                                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded font-medium transition-colors"
                            >
                                Export
                            </button>
                            <button
                                onClick={() => setIsExportOpen(false)}
                                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded font-medium transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}