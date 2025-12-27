import React, { useEffect, useRef } from 'react';
import { useEditor } from '../../context/EditorContext';
import { loadPlayCanvas } from '../../core/playcanvas/PlayCanvasLoader';
import { EntityFactory } from '../../core/playcanvas/EntityFactory';
import { GizmoHandler } from '../../core/controllers/GizmoHandler';
import { Selector } from '../../core/controllers/Selector';
import { CameraController } from '../../core/controllers/CameraController';

export default function PlayCanvasCanvas({ onReady }) {
    const canvasRef = useRef(null);
    const entityFactoryRef = useRef(null);

    const {
        setSelectedEntity,
        addEntity,
        setIsLoading,
        appRef,
        pcRef,
        gizmoHandlerRef,
        selectorRef,
        cameraControllerRef
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

                // Create initial objects
                const plane = entityFactory.createEntity('plane', { x: 1, y: 0, z: 1 });

                addEntity(plane);

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

                // Gizmo handler
                const gizmoHandler = new GizmoHandler(pc, app, camera.camera);
                gizmoHandlerRef.current = gizmoHandler;
                gizmoHandler.switch('translate');

                // Selector
                const worldLayer = app.scene.layers.getLayerByName('World');
                const selector = new Selector(pc, app, camera.camera, [worldLayer]);
                selectorRef.current = selector;

                selector.on('select', (node, clear) => {
                    gizmoHandler.add(node, clear);
                    setSelectedEntity(node.name);
                });

                selector.on('deselect', () => {
                    gizmoHandler.clear();
                    setSelectedEntity(null);
                });

                // Resize handler
                const resize = () => {
                    app.resizeCanvas();
                    const bounds = canvas.getBoundingClientRect();
                    const dim = camera.camera.horizontalFov ? bounds.width : bounds.height;
                    gizmoHandler.size = 500/ dim;
                };
                window.addEventListener('resize', resize);

                setTimeout(() => {
                    resize();
                    selector.fire('select', plane, true);
                    setIsLoading(false);
                    if (onReady) onReady(entityFactory);
                }, 100);

                // Cleanup
                cleanup = () => {
                    window.removeEventListener('resize', resize);
                    cameraController.destroy();
                    gizmoHandler.destroy();
                    selector.destroy();
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