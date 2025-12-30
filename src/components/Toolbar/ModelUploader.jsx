import React, { useRef, useState } from 'react';
import { useEditor } from '../../context/EditorContext';
import { Upload, Loader, X } from 'lucide-react';

export default function ModelUploader({ modelLoader }) {
    const fileInputRef = useRef(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingFile, setLoadingFile] = useState('');
    const { addEntity } = useEditor();

    const handleFileSelect = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0 || !modelLoader) return;

        setIsLoading(true);

        let successCount = 0;
        let failCount = 0;

        for (const file of files) {
            try {
                setLoadingFile(file.name);
                console.log(`Loading model: ${file.name}`);

                // Load the model
                const entity = await modelLoader.loadModelFromFile(file);

                // Add to entities list
                addEntity(entity);

                successCount++;
                console.log(`✅ Model loaded: ${entity.name}`);

            } catch (error) {
                failCount++;
                console.error(`❌ Failed to load ${file.name}:`, error);
                alert(`Failed to load ${file.name}: ${error.message}`);
            }
        }

        setLoadingFile('');
        setIsLoading(false);

        if (successCount > 0) {
            console.log(`✅ Successfully loaded ${successCount} model(s)`);
        }
        if (failCount > 0) {
            console.log(`❌ Failed to load ${failCount} model(s)`);
        }

        // Reset file input
        e.target.value = '';
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="relative">
            <button
                onClick={handleClick}
                disabled={isLoading}
                className="px-4 py-2 rounded bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium transition-colors flex items-center gap-2"
                title="Upload 3D Model (GLB, GLTF, OBJ)"
            >
                {isLoading ? (
                    <>
                        <Loader size={18} className="animate-spin" />
                        Loading...
                    </>
                ) : (
                    <>
                        <Upload size={18} />
                        Upload Model
                    </>
                )}
            </button>

            {loadingFile && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-black/90 rounded-lg p-3 text-white text-sm shadow-lg">
                    <div className="flex items-center gap-2">
                        <Loader size={16} className="animate-spin" />
                        <span className="truncate">{loadingFile}</span>
                    </div>
                </div>
            )}

            <input
                ref={fileInputRef}
                type="file"
                accept=".glb,.gltf,.obj"
                multiple
                onChange={handleFileSelect}
                className="hidden"
            />
        </div>
    );
}