// PlayCanvasCanvas.jsx - Fixed version

import React, { useEffect, useRef } from 'react';
import { useEditor } from '../../context/EditorContext';
import { loadPlayCanvas } from '../../core/playcanvas/PlayCanvasLoader';
import { EntityFactory } from '../../core/playcanvas/EntityFactory';
import { GizmoHandler } from '../../core/controllers/GizmoHandler';
import { Selector } from '../../core/controllers/Selector';
import { CameraController } from '../../core/controllers/CameraController';
import { TransformCommand } from '../../core/history/commands/TransformCommand';
import { SceneSerializer } from '../../core/scene/SceneSerializer';
import { ModelLoader } from '../../core/loaders/ModelLoader';

export default function PlayCanvasCanvas({ onReady }) {
    const canvasRef = useRef(null);
    const entityFactoryRef = useRef(null);
    const originalMaterialsRef = useRef(new Map());
    const highlightedEntitiesRef = useRef(new Set());

    const {
        setSelectedEntity,
        addEntity,
        setIsLoading,
        executeCommand,
        appRef,
        pcRef,
        gizmoHandlerRef,
        selectorRef,
        cameraControllerRef,
        sceneSerializerRef,
        modelLoaderRef
    } = useEditor();

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        let cleanup;

        loadPlayCanvas().then((pc) => {
            pcRef.current = pc;

            const gfxOptions = {
                deviceTypes: ['webgl2', 'webgl1']
            };

            pc.createGraphicsDevice(canvas, gfxOptions).then(device => {
                device.maxPixelRatio = Math.min(window.devicePixelRatio, 2);

                const app = new pc.Application(canvas, {
                    mouse: new pc.Mouse(canvas),
                    touch: new pc.TouchDevice(canvas),
                    graphicsDevice: device
                });

                app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
                app.setCanvasResolution(pc.RESOLUTION_AUTO);
                app.start();

                appRef.current = app;
                app.scene.ambientLight = new pc.Color(1, 1, 1);

                // Initialize ModelLoader
                const modelLoader = new ModelLoader(pc, app);
                modelLoaderRef.current = modelLoader;

                // Initialize EntityFactory
                const entityFactory = new EntityFactory(pc, app);
                entityFactoryRef.current = entityFactory;

                // Initialize SceneSerializer
                const sceneSerializer = new SceneSerializer(pc, app);
                sceneSerializer.entityFactory = entityFactory;
                sceneSerializerRef.current = sceneSerializer;

                // Create initial objects
                const plane = entityFactory.createEntity('plane', { x: 0, y: 0, z: 0 });

                addEntity(plane);

                // Camera
                const camera = entityFactory.createCamera();

                // Camera controls
                const cameraController = new CameraController(pc, camera, canvas);
                cameraControllerRef.current = cameraController;
                app.on('gizmo:pointer', (hasPointer) => {
                    cameraController.enabled = !hasPointer;
                });

                // Light
                entityFactory.createLight('directional');

                // Gizmo handler with transform callbacks
                const handleTransformStart = () => {
                    console.log('Transform started');
                };

                const handleTransformEnd = (entity, transformType, oldValues, newValues) => {
                    const command = new TransformCommand(
                        entity,
                        transformType,
                        oldValues,
                        newValues
                    );
                    executeCommand(command, true);
                };

                const gizmoHandler = new GizmoHandler(
                    pc,
                    app,
                    camera.camera,
                    handleTransformStart,
                    handleTransformEnd
                );
                gizmoHandlerRef.current = gizmoHandler;
                gizmoHandler.switch('translate');

                const worldLayer = app.scene.layers.getLayerByName('World');
                const selector = new Selector(pc, app, camera.camera, [worldLayer]);
                selectorRef.current = selector;

                // Handle selection with highlight effect
                selector.on('select', (node, clear) => {
                    gizmoHandler.add(node, clear);
                    setSelectedEntity(node.name);

                    if (node.render) {
                        const meshInstances = node.render.meshInstances;

                        // Store original materials only if not already stored
                        if (!originalMaterialsRef.current.has(node)) {
                            const materials = meshInstances.map(mi => ({
                                material: mi.material,
                                diffuse: mi.material.diffuse.clone(),
                                emissive: mi.material.emissive ? mi.material.emissive.clone() : new pc.Color(0, 0, 0),
                                emissiveIntensity: mi.material.emissiveIntensity || 0
                            }));
                            originalMaterialsRef.current.set(node, materials);
                        }

                        // Apply highlight by modifying emissive properties
                        meshInstances.forEach((meshInstance) => {
                            meshInstance.material.emissive = new pc.Color(0.3, 0.5, 1);
                            meshInstance.material.emissiveIntensity = 0.3;
                            meshInstance.material.update();
                        });

                        highlightedEntitiesRef.current.add(node);
                    }
                });

                selector.on('deselect', () => {
                    gizmoHandler.clear();

                    // Restore original emissive properties for highlighted entities
                    highlightedEntitiesRef.current.forEach((node) => {
                        if (node.render) {
                            const meshInstances = node.render.meshInstances;
                            const originalData = originalMaterialsRef.current.get(node);

                            if (originalData) {
                                meshInstances.forEach((meshInstance, index) => {
                                    if (originalData[index]) {
                                        // Restore emissive properties only
                                        meshInstance.material.emissive = originalData[index].emissive.clone();
                                        meshInstance.material.emissiveIntensity = originalData[index].emissiveIntensity;
                                        meshInstance.material.update();
                                    }
                                });
                            }
                        }
                    });

                    // Clear highlighted entities set
                    highlightedEntitiesRef.current.clear();
                    setSelectedEntity(null);
                });

                // Resize handler
                const resize = () => {
                    app.resizeCanvas();
                    const bounds = canvas.getBoundingClientRect();
                    const dim = camera.camera.horizontalFov ? bounds.width : bounds.height;
                    gizmoHandler.size = 800 / dim;
                };
                window.addEventListener('resize', resize);

                setTimeout(() => {
                    resize();
                    selector.fire('select', plane, true);
                    setIsLoading(false);
                    if (onReady) onReady(entityFactory, modelLoader);
                }, 100);

                // Cleanup
                cleanup = () => {
                    window.removeEventListener('resize', resize);
                    cameraController.destroy();
                    gizmoHandler.destroy();
                    selector.destroy();
                    originalMaterialsRef.current.clear();
                    highlightedEntitiesRef.current.clear();
                    app.destroy();
                };
            }).catch(error => {
                console.error('Failed to create graphics device:', error);
                setIsLoading(false);
            });
        }).catch(error => {
            console.error('Failed to load PlayCanvas:', error);
            setIsLoading(false);
        });

        return () => {
            if (cleanup) cleanup();
        };
    },[]);

    return <canvas ref={canvasRef} className="w-full h-full" />;
}