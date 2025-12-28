import React, { useEffect, useRef } from 'react';
import { useEditor } from '../../context/EditorContext';
import { loadPlayCanvas } from '../../core/playcanvas/PlayCanvasLoader';
import { EntityFactory } from '../../core/playcanvas/EntityFactory';
import { GizmoHandler } from '../../core/controllers/GizmoHandler';
import { Selector } from '../../core/controllers/Selector';
import { CameraController } from '../../core/controllers/CameraController';
import { TransformCommand } from '../../core/history/commands/TransformCommand';
import { SceneSerializer } from '../../core/scene/SceneSerializer';

export default function PlayCanvasCanvas({ onReady }) {
    const canvasRef = useRef(null);
    const entityFactoryRef = useRef(null);
    const originalMaterialsRef = useRef(new Map());

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
        sceneSerializerRef
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
                app.scene.ambientLight = new pc.Color(0.2, 0.2, 0.2);

                

                // Initialize EntityFactory
                const entityFactory = new EntityFactory(pc, app);
                entityFactoryRef.current = entityFactory;

                // Initialize SceneSerializer
                const sceneSerializer = new SceneSerializer(pc, app);
                sceneSerializer.entityFactory = entityFactory; // Store reference
                sceneSerializerRef.current = sceneSerializer;

                // Create initial objects
                const box = entityFactory.createEntity('box', { x: 1, y: 0, z: 1 });
                const sphere = entityFactory.createEntity('sphere', { x: -1, y: 0, z: 1 });
                const cone = entityFactory.createEntity('cone', { x: -1, y: 0, z: -1 });
                const capsule = entityFactory.createEntity('capsule', { x: 1, y: 0, z: -1 });

                addEntity(box);
                addEntity(sphere);
                addEntity(cone);
                addEntity(capsule);

                // Camera
                const camera = entityFactory.createCamera();

                // Camera controls
                const cameraController = new CameraController(pc, camera);
                cameraControllerRef.current = cameraController;
                app.on('gizmo:pointer', (hasPointer) => {
                    cameraController.enabled = !hasPointer;
                });

                // Light
                entityFactory.createLight('directional');

                // Gizmo handler with transform callbacks
                const handleTransformStart = () => {
                    // Optional: Add visual feedback when transform starts
                    console.log('Transform started');
                };

                const handleTransformEnd = (entity, transformType, oldValues, newValues) => {
                    // Create transform command
                    const command = new TransformCommand(
                        entity,
                        transformType,
                        oldValues,
                        newValues
                    );

                    // Add to history (skipExecute = true because gizmo already applied the transform)
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

                // Selector
                const worldLayer = app.scene.layers.getLayerByName('World');
                const selector = new Selector(pc, app, camera.camera, [worldLayer]);
                selectorRef.current = selector;

                // Handle selection with highlight effect
                selector.on('select', (node, clear) => {
                    gizmoHandler.add(node, clear);
                    setSelectedEntity(node.name);

                    // Add highlight to selected object
                    if (node.render) {
                        const meshInstances = node.render.meshInstances;
                        meshInstances.forEach((meshInstance, index) => {
                            // Store original material if not already stored
                            if (!originalMaterialsRef.current.has(node)) {
                                originalMaterialsRef.current.set(node, []);
                            }
                            const materialsArray = originalMaterialsRef.current.get(node);
                            if (!materialsArray[index]) {
                                materialsArray[index] = meshInstance.material;
                            }

                            // Create highlighted material
                            const highlightMaterial = meshInstance.material.clone();
                            highlightMaterial.emissive = new pc.Color(0.3, 0.5, 1); // Blue glow
                            highlightMaterial.emissiveIntensity = 0.3;
                            highlightMaterial.update();
                            meshInstance.material = highlightMaterial;
                        });
                    }
                });

                selector.on('deselect', () => {
                    gizmoHandler.clear();

                    // Restore original materials
                    originalMaterialsRef.current.forEach((materials, node) => {
                        if (node.render) {
                            const meshInstances = node.render.meshInstances;
                            meshInstances.forEach((meshInstance, index) => {
                                if (materials[index]) {
                                    meshInstance.material = materials[index];
                                }
                            });
                        }
                    });
                    originalMaterialsRef.current.clear();

                    setSelectedEntity(null);
                });

                // Resize handler
                const resize = () => {
                    app.resizeCanvas();
                    const bounds = canvas.getBoundingClientRect();
                    const dim = camera.camera.horizontalFov ? bounds.width : bounds.height;
                    gizmoHandler.size = 1024 / dim;
                };
                window.addEventListener('resize', resize);

                setTimeout(() => {
                    resize();
                    selector.fire('select', box, true);
                    setIsLoading(false);
                    if (onReady) onReady(entityFactory);
                }, 100);

                // Cleanup
                cleanup = () => {
                    window.removeEventListener('resize', resize);
                    cameraController.destroy();
                    gizmoHandler.destroy();
                    selector.destroy();
                    originalMaterialsRef.current.clear();
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
    }, []);

    return <canvas ref={canvasRef} className="w-full h-full" />;
}