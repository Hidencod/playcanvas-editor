// components/AutoSave/AutoSaveManager.jsx

import React, { useEffect, useState } from 'react';
import { useEditor } from '../../context/EditorContext';
import { Save, Check, AlertCircle, Clock } from 'lucide-react';

export default function AutoSaveManager() {
    const {
        entities,
        sceneSerializerRef,
        assetManagerRef,
        addEntity,
        clearScene,
        isLoading
    } = useEditor();

    const [lastSaveTime, setLastSaveTime] = useState(null);
    const [saveStatus, setSaveStatus] = useState('idle'); // idle, saving, saved, error
    const [showRestorePrompt, setShowRestorePrompt] = useState(false);
    const [autoSaveData, setAutoSaveData] = useState(null);
    const [autoSaveEnabled, setAutoSaveEnabled] = useState(() => {
        // Load from localStorage
        const saved = localStorage.getItem('autoSaveEnabled');
        return saved !== null ? saved === 'true' : true; // Default enabled
    });
    const [showSettings, setShowSettings] = useState(false);

    // Save autoSave preference to localStorage
    useEffect(() => {
        localStorage.setItem('autoSaveEnabled', autoSaveEnabled.toString());
    }, [autoSaveEnabled]);

    // Check for auto-saved scene on mount
    useEffect(() => {
        if (isLoading || !assetManagerRef?.current || !sceneSerializerRef?.current) return;

        const checkAutoSave = async () => {
            try {
                const project = await assetManagerRef.current.loadProject('__autosave__');

                if (project && project.sceneData) {
                    const savedDate = new Date(project.savedDate);
                    const now = new Date();
                    const hoursSince = (now - savedDate) / (1000 * 60 * 60);

                    // Only show restore if saved within last 24 hours
                    if (hoursSince < 24) {
                        setAutoSaveData(project.sceneData);
                        setShowRestorePrompt(true);
                        console.log('📂 Found auto-saved scene from:', savedDate);
                    }
                }
            } catch (error) {
                // No auto-save found, that's okay
                console.log('No auto-save found');
            }
        };

        checkAutoSave();
    }, [isLoading, assetManagerRef, sceneSerializerRef]);

    // Manual save function
    const saveNow = async () => {
        if (!sceneSerializerRef.current || !assetManagerRef?.current) {
            console.warn('Cannot save: serializer or assetManager not ready');
            return;
        }

        setSaveStatus('saving');

        try {
            const sceneData = sceneSerializerRef.current.exportScene(entities);
            await assetManagerRef.current.saveProject('__autosave__', sceneData);

            setLastSaveTime(new Date());
            setSaveStatus('saved');

            // Reset to idle after 2 seconds
            setTimeout(() => setSaveStatus('idle'), 2000);

            console.log('💾 Manually saved scene');
        } catch (error) {
            console.error('Manual save failed:', error);
            setSaveStatus('error');
            setTimeout(() => setSaveStatus('idle'), 3000);
        }
    };

    // Auto-save periodically (only if enabled)
    useEffect(() => {
        if (!autoSaveEnabled) return;
        if (!sceneSerializerRef.current || !assetManagerRef?.current) return;
        if (entities.length === 0) return;

        const interval = setInterval(async () => {
            await saveNow();
        }, 30000); // Save every 30 seconds

        return () => clearInterval(interval);
    }, [entities, sceneSerializerRef, assetManagerRef, autoSaveEnabled]);

    const handleRestore = async () => {
        if (!autoSaveData || !sceneSerializerRef.current) return;

        try {
            // Make sure assetManager is set
            if (assetManagerRef?.current && !sceneSerializerRef.current.assetManager) {
                sceneSerializerRef.current.assetManager = assetManagerRef.current;
            }

            // Clear the current scene first (except camera and light)
            if (typeof clearScene === 'function') {
                clearScene();
            }

            const entityFactory = sceneSerializerRef.current.entityFactory;
            await sceneSerializerRef.current.importScene(autoSaveData, entityFactory, addEntity);

            setShowRestorePrompt(false);
            console.log('✅ Restored auto-saved scene');
        } catch (error) {
            console.error('Failed to restore auto-save:', error);
            alert('Failed to restore auto-saved scene: ' + error.message);
        }
    };

    const handleDismiss = () => {
        setShowRestorePrompt(false);
    };

    const formatTime = (date) => {
        if (!date) return '';
        const now = new Date();
        const diff = (now - date) / 1000; // seconds

        if (diff < 60) return 'just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return date.toLocaleDateString();
    };

    return (
        <>
            {/* Save Controls - Bottom Right */}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
                {/* Settings Panel */}
                {showSettings && (
                    <div className="bg-gray-800 border border-gray-600 rounded-lg shadow-xl p-4 mb-2 w-64">
                        <div className="text-white font-semibold mb-3 flex items-center gap-2">
                            <Clock size={16} />
                            Auto-Save Settings
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={autoSaveEnabled}
                                onChange={(e) => setAutoSaveEnabled(e.target.checked)}
                                className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-800"
                            />
                            <span className="text-sm text-gray-300">
                                Enable Auto-Save (every 30s)
                            </span>
                        </label>

                        {lastSaveTime && (
                            <div className="mt-3 text-xs text-gray-400">
                                Last saved: {formatTime(lastSaveTime)}
                            </div>
                        )}
                    </div>
                )}

                {/* Control Buttons */}
                <div className="flex items-center gap-2">
                    {/* Manual Save Button */}
                    <button
                        onClick={saveNow}
                        disabled={saveStatus === 'saving'}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg text-sm font-medium transition-colors ${saveStatus === 'saving'
                                ? 'bg-blue-600 text-white cursor-not-allowed'
                                : saveStatus === 'saved'
                                    ? 'bg-green-600 text-white'
                                    : saveStatus === 'error'
                                        ? 'bg-red-600 text-white'
                                        : 'bg-gray-800 text-white hover:bg-gray-700 border border-gray-600'
                            }`}
                        title="Save scene now"
                    >
                        {saveStatus === 'saving' && (
                            <>
                                <Save size={16} className="animate-pulse" />
                                <span>Saving...</span>
                            </>
                        )}
                        {saveStatus === 'saved' && (
                            <>
                                <Check size={16} />
                                <span>Saved!</span>
                            </>
                        )}
                        {saveStatus === 'error' && (
                            <>
                                <AlertCircle size={16} />
                                <span>Failed</span>
                            </>
                        )}
                        {saveStatus === 'idle' && (
                            <>
                                <Save size={16} />
                                <span>Save Scene</span>
                            </>
                        )}
                    </button>

                    {/* Settings Toggle */}
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className={`p-2 rounded-lg shadow-lg transition-colors border ${showSettings
                                ? 'bg-blue-600 text-white border-blue-500'
                                : 'bg-gray-800 text-white hover:bg-gray-700 border-gray-600'
                            }`}
                        title="Auto-save settings"
                    >
                        <Clock size={16} />
                    </button>
                </div>

                {/* Auto-Save Indicator */}
                {autoSaveEnabled && saveStatus === 'idle' && (
                    <div className="text-xs text-gray-400 bg-gray-800 border border-gray-700 rounded px-2 py-1">
                        Auto-save: ON
                    </div>
                )}
            </div>

            {/* Restore Prompt */}
            {showRestorePrompt && (
                <>
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-50" />
                    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-50 p-6 w-96">
                        <div className="flex items-center gap-3 mb-4">
                            <Save size={24} className="text-blue-400" />
                            <h3 className="text-lg font-semibold text-white">Restore Previous Session?</h3>
                        </div>

                        <p className="text-sm text-gray-300 mb-4">
                            We found an auto-saved scene from your previous session. Would you like to restore it?
                        </p>

                        {autoSaveData && (
                            <div className="bg-gray-900 rounded p-3 mb-4">
                                <div className="text-xs text-gray-400 space-y-1">
                                    <div>Objects: {autoSaveData.entities?.length || 0}</div>
                                    <div>Saved: {new Date(autoSaveData.timestamp).toLocaleString()}</div>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={handleRestore}
                                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
                            >
                                Restore
                            </button>
                            <button
                                onClick={handleDismiss}
                                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded font-medium transition-colors"
                            >
                                Start Fresh
                            </button>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}