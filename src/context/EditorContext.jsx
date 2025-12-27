import React, { createContext, useContext, useState, useRef } from 'react';

const EditorContext = createContext();

export const EditorProvider = ({ children }) => {
    const [selectedEntity, setSelectedEntity] = useState(null);
    const [entities, setEntities] = useState([]);
    const [gizmoMode, setGizmoMode] = useState('translate');
    const [coordSpace, setCoordSpace] = useState('world');
    const [isLoading, setIsLoading] = useState(true);

    const appRef = useRef(null);
    const pcRef = useRef(null);
    const gizmoHandlerRef = useRef(null);
    const selectorRef = useRef(null);
    const cameraControllerRef = useRef(null);

    const addEntity = (entity) => {
        setEntities(prev => [...prev, { name: entity.name, entity }]);
    };

    const removeEntity = (entityName) => {
        const entityObj = entities.find(e => e.name === entityName);
        if (entityObj && appRef.current) {
            entityObj.entity.destroy();
            setEntities(prev => prev.filter(e => e.name !== entityName));
            if (selectedEntity === entityName) {
                setSelectedEntity(null);
            }
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
            cameraControllerRef
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