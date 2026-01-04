// hooks/useAutoSave.js

import { useEffect, useRef } from 'react';
import { useEditor } from '../context/EditorContext';

export function useAutoSave(intervalMs = 30000) { // Default: save every 30 seconds
    const { entities, sceneSerializerRef, assetManagerRef } = useEditor();
    const lastSaveTimeRef = useRef(Date.now());
    const saveTimeoutRef = useRef(null);

    useEffect(() => {
        // Don't auto-save if no serializer or no entities
        if (!sceneSerializerRef.current || entities.length === 0) {
            return;
        }

        // Clear existing timeout
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        // Set new timeout for auto-save
        saveTimeoutRef.current = setTimeout(async () => {
            try {
                const sceneData = sceneSerializerRef.current.exportScene(entities);

                // Save to AssetManager's project store
                if (assetManagerRef?.current) {
                    await assetManagerRef.current.saveProject('__autosave__', sceneData);
                    lastSaveTimeRef.current = Date.now();
                    console.log('💾 Auto-saved scene');
                }
            } catch (error) {
                console.error('Auto-save failed:', error);
            }
        }, intervalMs);

        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [entities, sceneSerializerRef, assetManagerRef, intervalMs]);

    return {
        lastSaveTime: lastSaveTimeRef.current
    };
}