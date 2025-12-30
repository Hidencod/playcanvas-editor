import React, { createContext, useContext, useState, useRef } from 'react';
import { HistoryManager } from '../core/history/HistoryManager';
import { SceneSerializer } from '../core/scene/SceneSerializer';
const EditorContext = createContext();

export const EditorProvider = ({ children }) => {
    const [selectedEntity, setSelectedEntity] = useState(null);
    const [entities, setEntities] = useState([]);
    const [gizmoMode, setGizmoMode] = useState('translate');
    const [coordSpace, setCoordSpace] = useState('world');
    const [isLoading, setIsLoading] = useState(true);
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);

    const appRef = useRef(null);
    const pcRef = useRef(null);
    const gizmoHandlerRef = useRef(null);
    const selectorRef = useRef(null);
    const cameraControllerRef = useRef(null);
    const historyManagerRef = useRef(new HistoryManager());
    const sceneSerializerRef = useRef(null);
    const modelLoaderRef = useRef(null);
    const updateHistoryState = () => {
        setCanUndo(historyManagerRef.current.canUndo());
        setCanRedo(historyManagerRef.current.canRedo());
    };
    const clearScene = () => {
        // Remove all entities except camera and light
        entities.forEach(({ entity }) => {
            if (entity.name !== 'camera' && entity.name !== 'light') {
                entity.destroy();
            }
        });
        setEntities([]);
        setSelectedEntity(null);
        if (gizmoHandlerRef.current) {
            gizmoHandlerRef.current.clear();
        }
        historyManagerRef.current.clear();
        updateHistoryState();
    };

    const addEntity = (entity) => {
        setEntities(prev => [...prev, { name: entity.name, entity }]);
    };

    const removeEntity = (entityName) => {
        setEntities(prev => prev.filter(e => e.name !== entityName));
        if (selectedEntity === entityName) {
            setSelectedEntity(null);
            if (gizmoHandlerRef.current) {
                gizmoHandlerRef.current.clear();
            }
        }
    };

    const executeCommand = (command, skipExecute = false) => {
        if (skipExecute) {
            // Command was already executed (like transforms from gizmo)
            historyManagerRef.current.undoStack.push(command);
            historyManagerRef.current.redoStack = [];
        } else {
            // Command needs to be executed
            historyManagerRef.current.execute(command);
        }
        updateHistoryState();
    };

    const undo = () => {
        const success = historyManagerRef.current.undo();
        if (success) {
            // Update gizmo position after undo
            updateGizmoPosition();
        }
        updateHistoryState();
    };

    const redo = () => {
        const success = historyManagerRef.current.redo();
        if (success) {
            // Update gizmo position after redo
            updateGizmoPosition();
        }
        updateHistoryState();
    };

    const updateGizmoPosition = () => {
        // Force gizmo to update its position
        if (gizmoHandlerRef.current && gizmoHandlerRef.current._nodes.length > 0) {
            const nodes = gizmoHandlerRef.current._nodes;
            gizmoHandlerRef.current.gizmo.detach();
            gizmoHandlerRef.current.gizmo.attach(nodes);
        }
    };
    return (
        <EditorContext.Provider value={{
            selectedEntity,
            setSelectedEntity,
            entities,
            addEntity,
            removeEntity,
            gizmoMode,
            setGizmoMode,
            coordSpace,
            setCoordSpace,
            isLoading,
            setIsLoading,
            appRef,
            pcRef,
            gizmoHandlerRef,
            selectorRef,
            cameraControllerRef,
            historyManagerRef,
            executeCommand,
            undo,
            redo,
            canUndo,
            canRedo,
            sceneSerializerRef,
            clearScene,
            modelLoaderRef
        }}>
            {children}
        </EditorContext.Provider>
    );
};

export const useEditor = () => {
    const context = useContext(EditorContext);
    if (!context) {
        throw new Error('useEditor must be used within EditorProvider');
    }
    return context;
};