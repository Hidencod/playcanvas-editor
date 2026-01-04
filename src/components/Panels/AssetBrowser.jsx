import React, { useState, useEffect } from 'react';
import { useEditor } from '../../context/EditorContext';
import { Upload, Trash2, Package, HardDrive, Plus } from 'lucide-react';

export default function AssetBrowser() {
    const { assetManagerRef, modelLoaderRef, addEntity } = useEditor();
    const [assets, setAssets] = useState([]);
    const [storageInfo, setStorageInfo] = useState(null);
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

    useEffect(() => {
        // Poll until assetManager is ready, then load assets
        const checkAndLoad = () => {
            if (assetManagerRef?.current) {
                console.log('🔄 Loading assets from database...');
                loadAssets();
                loadStorageInfo();
                return true;
            }
            return false;
        };

        // Try immediately
        if (!checkAndLoad()) {
            // If not ready, poll every 100ms
            const interval = setInterval(() => {
                if (checkAndLoad()) {
                    clearInterval(interval);
                }
            }, 100);

            return () => clearInterval(interval);
        }
    }, [assetManagerRef]);

    const loadAssets = () => {
        if (assetManagerRef?.current) {
            const allAssets = assetManagerRef.current.getAllAssets();
            console.log('📦 Loaded assets:', allAssets.length, allAssets);
            setAssets(allAssets);
        }
    };

    const loadStorageInfo = async () => {
        if (assetManagerRef?.current) {
            const info = await assetManagerRef.current.getStorageInfo();
            setStorageInfo(info);
        }
    };

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        console.log('📁 Files selected:', files.length);

        if (files.length === 0 || !assetManagerRef?.current) {
            console.warn('No files or AssetManager not ready');
            return;
        }

        for (const file of files) {
            try {
                console.log(`⬆️ Uploading: ${file.name}`);
                const assetId = await assetManagerRef.current.storeAsset(file);
                console.log(`✅ Uploaded: ${file.name} with ID: ${assetId}`);
            } catch (error) {
                console.error('Failed to upload asset:', error);
                alert(`Failed to upload ${file.name}: ${error.message}`);
            }
        }

        console.log('🔄 Reloading assets...');
        loadAssets();
        loadStorageInfo();
        e.target.value = '';
    };

    const handleAddToScene = async (assetId) => {
        if (!assetManagerRef.current || !modelLoaderRef.current) return;

        try {
            const file = await assetManagerRef.current.getAssetAsFile(assetId);
            const entity = await modelLoaderRef.current.loadModelFromFile(file);

            entity.assetId = assetId;

            addEntity(entity);
            console.log(`✅ Added asset to scene: ${file.name}`);
        } catch (error) {
            console.error('Failed to add asset to scene:', error);
            alert(`Failed to add asset: ${error.message}`);
        }
    };

    const handleDeleteAsset = async (assetId) => {
        try {
            await assetManagerRef.current.deleteAsset(assetId);
            loadAssets();
            loadStorageInfo();
            if (selectedAsset === assetId) {
                setSelectedAsset(null);
            }
            setShowDeleteConfirm(null);
        } catch (error) {
            console.error('Failed to delete asset:', error);
            alert(`Failed to delete: ${error.message}`);
        }
    };

    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    return (
        <div className="h-full flex flex-col bg-gray-800 text-white relative">
            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <>
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50 z-50"
                        onClick={() => setShowDeleteConfirm(null)}
                    />
                    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-50 p-6 w-96">
                        <h3 className="text-lg font-semibold mb-3">Delete Asset?</h3>
                        <p className="text-sm text-gray-400 mb-4">
                            Are you sure you want to delete "{showDeleteConfirm.name}"? This action cannot be undone.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowDeleteConfirm(null)}
                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDeleteAsset(showDeleteConfirm.id)}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-sm transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* Top Bar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700 bg-gray-750 flex-shrink-0">
                <div className="flex items-center gap-4">
                    {/* Upload Button */}
                    <label className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded cursor-pointer text-sm transition-colors flex items-center gap-2">
                        <Upload size={14} />
                        Import Asset
                        <input
                            type="file"
                            accept=".glb,.gltf,.obj"
                            multiple
                            onChange={handleFileUpload}
                            className="hidden"
                        />
                    </label>

                    {/* Storage Info */}
                    {storageInfo && (
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                            <HardDrive size={14} />
                            <span>
                                {storageInfo.usedMB}MB / {storageInfo.availableMB}MB
                            </span>
                        </div>
                    )}

                    {/* Asset Count */}
                    <div className="text-xs text-gray-400">
                        {assets.length} asset{assets.length !== 1 ? 's' : ''}
                    </div>
                </div>

                {/* Add to Scene Button */}
                {selectedAsset && (
                    <button
                        onClick={() => handleAddToScene(selectedAsset)}
                        className="px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded text-sm transition-colors flex items-center gap-2"
                    >
                        <Plus size={14} />
                        Add to Scene
                    </button>
                )}
            </div>

            {/* Asset Grid - Horizontal Scroll */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden p-4">
                {assets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <Package size={48} className="mb-3 opacity-50" />
                        <p className="text-sm">No assets uploaded</p>
                        <p className="text-xs mt-1">Import 3D models to reuse them</p>
                    </div>
                ) : (
                    <div className="flex gap-3 h-full">
                        {assets.map((asset) => (
                            <div
                                key={asset.id}
                                onClick={() => setSelectedAsset(asset.id)}
                                onDoubleClick={() => handleAddToScene(asset.id)}
                                className={`group relative flex-shrink-0 w-40 h-full rounded border-2 cursor-pointer transition-all ${selectedAsset === asset.id
                                    ? 'border-blue-500 bg-blue-900/20'
                                    : 'border-gray-700 hover:border-gray-600 bg-gray-750'
                                    }`}
                            >
                                {/* Model Icon/Preview */}
                                <div className="w-full h-32 bg-gray-700 rounded-t flex items-center justify-center">
                                    <Package size={48} className="text-gray-500" />
                                </div>

                                {/* Info */}
                                <div className="p-3 flex flex-col justify-between flex-1">
                                    <div>
                                        <div className="text-sm font-medium truncate mb-1" title={asset.name}>
                                            {asset.name}
                                        </div>
                                        <div className="text-xs text-gray-400">
                                            {formatBytes(asset.size)}
                                        </div>
                                    </div>
                                </div>

                                {/* Delete Button */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowDeleteConfirm(asset);
                                    }}
                                    className="absolute top-2 right-2 p-1.5 bg-red-600 hover:bg-red-700 rounded opacity-0 group-hover:opacity-100 transition-all"
                                    title="Delete asset"
                                >
                                    <Trash2 size={12} />
                                </button>

                                {/* Selected Indicator */}
                                {selectedAsset === asset.id && (
                                    <div className="absolute inset-0 border-2 border-blue-500 rounded pointer-events-none" />
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}