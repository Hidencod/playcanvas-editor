import React, { useEffect } from 'react';
import { EditorProvider, useEditor } from './context/EditorContext';
import EditorLayout from './components/Layout/EditorLayout';
import { DeleteEntityCommand } from './core/history/commands/DeleteEntityCommand';

function KeyboardHandler() {
  const {
    gizmoHandlerRef,
    pcRef,
    selectedEntity,
    cameraControllerRef,
    entities,
    appRef,
    coordSpace,
    setCoordSpace,
    setGizmoMode,
    removeEntity,
    executeCommand,
    addEntity,
    undo,  // ADD THIS
    redo   // ADD THIS
  } = useEditor();

  useEffect(() => {

    const handleKeyDown = (e) => {
      if (!gizmoHandlerRef.current || !pcRef.current) return;

      // Undo/Redo shortcuts
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
        return;
      }

      gizmoHandlerRef.current.gizmo.snap = !!e.shiftKey;
      gizmoHandlerRef.current.gizmo.uniform = !e.ctrlKey;

      const pc = pcRef.current;
      const tmpV1 = new pc.Vec3();

      switch (e.key.toLowerCase()) {
        case 'f':
          if (selectedEntity && cameraControllerRef.current) {
            const point = gizmoHandlerRef.current.gizmo.root.getPosition();
            const camera = appRef.current.root.findByName('camera');
            const start = tmpV1.copy(camera.forward).mulScalar(-8).add(point);
            cameraControllerRef.current.reset(point, start);
          }
          break;
        case 'r':
          if (cameraControllerRef.current) {
            cameraControllerRef.current.focus(new pc.Vec3(0, 0, 0));
          }
          break;
        case 'delete':
          
          if (selectedEntity) {
            const entityObj = entities.find(e => e.name === selectedEntity);
            
                   if (entityObj) {
                       const command = new DeleteEntityCommand(
                           entityObj.entity,
                           addEntity,
                           removeEntity
                       );
                       executeCommand(command);
                   }
          }
          break;
      }
    };

    const handleKeyUp = (e) => {
      if (!gizmoHandlerRef.current) return;
      gizmoHandlerRef.current.gizmo.snap = !!e.shiftKey;
      gizmoHandlerRef.current.gizmo.uniform = !e.ctrlKey;
    };

    const handleKeyPress = (e) => {
      if (!gizmoHandlerRef.current) return;

      switch (e.key.toLowerCase()) {
        case 'x':
          const newSpace = coordSpace === 'world' ? 'local' : 'world';
          setCoordSpace(newSpace);
          gizmoHandlerRef.current.gizmo.coordSpace = newSpace;
          break;
        case '1':
          setGizmoMode('translate');
          gizmoHandlerRef.current.switch('translate');
          break;
        case '2':
          setGizmoMode('rotate');
          gizmoHandlerRef.current.switch('rotate');
          break;
        case '3':
          setGizmoMode('scale');
          gizmoHandlerRef.current.switch('scale');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('keypress', handleKeyPress);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('keypress', handleKeyPress);
    };
  }, [coordSpace, selectedEntity, undo, redo]); // ADD undo and redo to dependencies

  return null;
}

function App() {
  return (
    <EditorProvider>
      <KeyboardHandler />
      <EditorLayout />
    </EditorProvider>
  );
}

export default App;