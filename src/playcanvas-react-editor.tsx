import React, { useEffect, useRef, useState } from 'react';

// Main React Component
export default function PlayCanvasEditor() {
  const canvasRef = useRef(null);
  const appRef = useRef(null);
  const gizmoHandlerRef = useRef(null);
  const selectorRef = useRef(null);
  const cameraControllerRef = useRef(null);
  const pcRef = useRef(null);
  
  const [gizmoMode, setGizmoMode] = useState('translate');
  const [coordSpace, setCoordSpace] = useState('world');
  const [selectedObject, setSelectedObject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let cleanup;

    // Load PlayCanvas library
    const loadPlayCanvas = () => {
      return new Promise((resolve, reject) => {
        if (window.pc) {
          resolve(window.pc);
          return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/playcanvas/1.73.3/playcanvas.min.js';
        script.onload = () => resolve(window.pc);
        script.onerror = reject;
        document.head.appendChild(script);
      });
    };

    loadPlayCanvas().then((pc) => {
      pcRef.current = pc;

      // GizmoHandler class
      class GizmoHandler {
        constructor(app, cameraComponent) {
          this._type = 'translate';
          this._nodes = [];
          this._app = app;
          
          let layer = app.scene.layers.getLayerByName('Immediate');
          if (!layer) {
            layer = new pc.Layer({ name: "GizmoLayer" });
            layer.opaqueSortMode = pc.SORTMODE_NONE;
            layer.transparentSortMode = pc.SORTMODE_NONE;
            const worldLayer = app.scene.layers.getLayerByName('World');
            const idx = app.scene.layers.getOpaqueIndex(worldLayer);
            app.scene.layers.insert(layer, idx + 1);
          }
          
          this._gizmos = {
            translate: new pc.TranslateGizmo(app, cameraComponent, layer),
            rotate: new pc.RotateGizmo(app, cameraComponent, layer),
            scale: new pc.ScaleGizmo(app, cameraComponent, layer)
          };

          for (const type in this._gizmos) {
            const gizmo = this._gizmos[type];
            gizmo.on('pointer:down', (x, y, meshInstance) => {
              app.fire('gizmo:pointer', !!meshInstance);
            });
            gizmo.on('pointer:up', () => {
              app.fire('gizmo:pointer', false);
            });
          }
        }

        get type() { return this._type; }
        get gizmo() { return this._gizmos[this._type]; }
        get size() { return this.gizmo.size; }
        set size(value) {
          for (const type in this._gizmos) {
            this._gizmos[type].size = value;
          }
        }

        add(node, clear = false) {
          if (clear) this._nodes.length = 0;
          if (this._nodes.indexOf(node) === -1) {
            this._nodes.push(node);
          }
          this.gizmo.attach(this._nodes);
        }

        clear() {
          this._nodes.length = 0;
          this.gizmo.detach();
        }

        switch(type) {
          this.gizmo.detach();
          const coordSpace = this.gizmo.coordSpace;
          this._type = type ?? 'translate';
          this.gizmo.attach(this._nodes);
          this.gizmo.coordSpace = coordSpace;
        }

        destroy() {
          for (const type in this._gizmos) {
            this._gizmos[type].destroy();
          }
        }
      }

      // Selector class
      class Selector extends pc.EventHandler {
        constructor(app, cameraComponent, layers = []) {
          super();
          this._app = app;
          this._camera = cameraComponent;
          this._scene = app.scene;
          this._picker = null;
          this._layers = layers;
          this._start = new pc.Vec2();
          this._epsilon = 1;

          this._onPointerDown = this._onPointerDown.bind(this);
          this._onPointerUp = this._onPointerUp.bind(this);
          
          window.addEventListener('pointerdown', this._onPointerDown);
          window.addEventListener('pointerup', this._onPointerUp);
        }

        _onPointerDown(e) {
          this._start.set(e.clientX, e.clientY);
        }

        async _onPointerUp(e) {
          if (Math.abs(e.clientX - this._start.x) > this._epsilon || 
              Math.abs(e.clientY - this._start.y) > this._epsilon) {
            return;
          }

          if (!this._picker) {
            const device = this._app.graphicsDevice;
            this._picker = new pc.Picker(this._app, device.canvas.clientWidth, device.canvas.clientHeight);
          }

          const device = this._app.graphicsDevice;
          this._picker.resize(device.canvas.clientWidth, device.canvas.clientHeight);
          this._picker.prepare(this._camera, this._scene, this._layers);

          const selection = await this._picker.getSelectionAsync(e.clientX - 1, e.clientY - 1, 2, 2);

          if (!selection[0]) {
            this.fire('deselect');
            return;
          }

          this.fire('select', selection[0].node, !e.ctrlKey && !e.metaKey);
        }

        destroy() {
          window.removeEventListener('pointerdown', this._onPointerDown);
          window.removeEventListener('pointerup', this._onPointerUp);
        }
      }

      // Camera Controller class
      class CameraController {
        constructor(cameraEntity) {
          this.camera = cameraEntity;
          this.focusPoint = new pc.Vec3(0, 0, 0);
          this.distance = 10;
          this.pitch = -30;
          this.yaw = 45;
          this.enabled = true;
          this.isDragging = false;
          this.lastX = 0;
          this.lastY = 0;

          this._onMouseDown = this._onMouseDown.bind(this);
          this._onMouseMove = this._onMouseMove.bind(this);
          this._onMouseUp = this._onMouseUp.bind(this);
          this._onWheel = this._onWheel.bind(this);

          window.addEventListener('mousedown', this._onMouseDown);
          window.addEventListener('mousemove', this._onMouseMove);
          window.addEventListener('mouseup', this._onMouseUp);
          window.addEventListener('wheel', this._onWheel);

          this.updatePosition();
        }

        _onMouseDown(e) {
          if (!this.enabled || e.button !== 0) return;
          this.isDragging = true;
          this.lastX = e.clientX;
          this.lastY = e.clientY;
        }

        _onMouseMove(e) {
          if (!this.isDragging || !this.enabled) return;
          
          const dx = e.clientX - this.lastX;
          const dy = e.clientY - this.lastY;
          
          this.yaw -= dx * 0.3;
          this.pitch -= dy * 0.3;
          this.pitch = Math.max(-89, Math.min(89, this.pitch));
          
          this.lastX = e.clientX;
          this.lastY = e.clientY;
          
          this.updatePosition();
        }

        _onMouseUp(e) {
          if (e.button === 0) {
            this.isDragging = false;
          }
        }

        _onWheel(e) {
          if (!this.enabled) return;
          e.preventDefault();
          this.distance += e.deltaY * 0.01;
          this.distance = Math.max(1, Math.min(50, this.distance));
          this.updatePosition();
        }

        updatePosition() {
          const pitchRad = this.pitch * Math.PI / 180;
          const yawRad = this.yaw * Math.PI / 180;
          
          const x = this.distance * Math.cos(pitchRad) * Math.sin(yawRad);
          const y = this.distance * Math.sin(pitchRad);
          const z = this.distance * Math.cos(pitchRad) * Math.cos(yawRad);
          
          this.camera.setPosition(
            this.focusPoint.x + x,
            this.focusPoint.y + y,
            this.focusPoint.z + z
          );
          this.camera.lookAt(this.focusPoint);
        }

        focus(point) {
          this.focusPoint.copy(point);
          this.updatePosition();
        }

        reset(point, position) {
          this.focusPoint.copy(point);
          const dir = new pc.Vec3().sub2(position, point).normalize();
          this.distance = position.distance(point);
          
          this.yaw = Math.atan2(dir.x, dir.z) * 180 / Math.PI;
          this.pitch = Math.asin(dir.y) * 180 / Math.PI;
          
          this.updatePosition();
        }

        destroy() {
          window.removeEventListener('mousedown', this._onMouseDown);
          window.removeEventListener('mousemove', this._onMouseMove);
          window.removeEventListener('mouseup', this._onMouseUp);
          window.removeEventListener('wheel', this._onWheel);
        }
      }

      // Initialize PlayCanvas
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

        // Scene settings
        app.scene.ambientLight = new pc.Color(0.2, 0.2, 0.2);

        // Helper function
        const createColorMaterial = (color) => {
          const material = new pc.StandardMaterial();
          material.diffuse = color;
          material.update();
          return material;
        };

        // Create entities
        const box = new pc.Entity('box');
        box.addComponent('render', {
          type: 'box',
          material: createColorMaterial(new pc.Color(0.8, 1, 1))
        });
        box.setPosition(1, 0, 1);
        app.root.addChild(box);

        const sphere = new pc.Entity('sphere');
        sphere.addComponent('render', {
          type: 'sphere',
          material: createColorMaterial(new pc.Color(1, 0.8, 1))
        });
        sphere.setPosition(-1, 0, 1);
        app.root.addChild(sphere);

        const cone = new pc.Entity('cone');
        cone.addComponent('render', {
          type: 'cone',
          material: createColorMaterial(new pc.Color(1, 1, 0.8))
        });
        cone.setPosition(-1, 0, -1);
        cone.setLocalScale(1.5, 2.25, 1.5);
        app.root.addChild(cone);

        const capsule = new pc.Entity('capsule');
        capsule.addComponent('render', {
          type: 'capsule',
          material: createColorMaterial(new pc.Color(0.8, 0.8, 1))
        });
        capsule.setPosition(1, 0, -1);
        app.root.addChild(capsule);

        // Camera
        const camera = new pc.Entity('camera');
        camera.addComponent('camera', {
          clearColor: new pc.Color(0.1, 0.1, 0.1),
          farClip: 1000
        });
        const cameraOffset = 8;
        camera.setPosition(cameraOffset, cameraOffset, cameraOffset);
        camera.lookAt(0, 0, 0);
        app.root.addChild(camera);

        // Camera controls
        const cameraController = new CameraController(camera);
        cameraControllerRef.current = cameraController;
        app.on('gizmo:pointer', (hasPointer) => {
          cameraController.enabled = !hasPointer;
        });

        // Light
        const light = new pc.Entity('light');
        light.addComponent('light', {
          type: 'directional',
          intensity: 1
        });
        light.setEulerAngles(45, 30, 0);
        app.root.addChild(light);

        // Gizmo handler
        const gizmoHandler = new GizmoHandler(app, camera.camera);
        gizmoHandlerRef.current = gizmoHandler;
        gizmoHandler.switch('translate');

        // Selector
        const worldLayer = app.scene.layers.getLayerByName('World');
        const selector = new Selector(app, camera.camera, [worldLayer]);
        selectorRef.current = selector;
        
        selector.on('select', (node, clear) => {
          gizmoHandler.add(node, clear);
          setSelectedObject(node.name);
        });

        selector.on('deselect', () => {
          gizmoHandler.clear();
          setSelectedObject(null);
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

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!gizmoHandlerRef.current || !pcRef.current) return;
      
      gizmoHandlerRef.current.gizmo.snap = !!e.shiftKey;
      gizmoHandlerRef.current.gizmo.uniform = !e.ctrlKey;

      const pc = pcRef.current;
      const tmpV1 = new pc.Vec3();
      
      switch (e.key.toLowerCase()) {
        case 'f':
          if (selectedObject && cameraControllerRef.current) {
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
          handleGizmoChange('translate');
          break;
        case '2':
          handleGizmoChange('rotate');
          break;
        case '3':
          handleGizmoChange('scale');
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
  }, [coordSpace, selectedObject]);

  const handleGizmoChange = (mode) => {
    setGizmoMode(mode);
    if (gizmoHandlerRef.current) {
      gizmoHandlerRef.current.switch(mode);
    }
  };

  const handleCoordSpaceToggle = () => {
    const newSpace = coordSpace === 'world' ? 'local' : 'world';
    setCoordSpace(newSpace);
    if (gizmoHandlerRef.current) {
      gizmoHandlerRef.current.gizmo.coordSpace = newSpace;
    }
  };

  const handleFocus = () => {
    if (selectedObject && cameraControllerRef.current && gizmoHandlerRef.current && pcRef.current) {
      const point = gizmoHandlerRef.current.gizmo.root.getPosition();
      const camera = appRef.current.root.findByName('camera');
      const pc = pcRef.current;
      const tmpV1 = new pc.Vec3();
      const start = tmpV1.copy(camera.forward).mulScalar(-8).add(point);
      cameraControllerRef.current.reset(point, start);
    }
  };

  const handleReset = () => {
    if (cameraControllerRef.current && pcRef.current) {
      const pc = pcRef.current;
      cameraControllerRef.current.focus(new pc.Vec3(0, 0, 0));
    }
  };

  return (
    <div className="w-full h-screen relative bg-gray-900">
      <canvas ref={canvasRef} className="w-full h-full" />
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="text-white text-xl">Loading PlayCanvas...</div>
        </div>
      )}
      
      {/* Top Toolbar */}
      <div className="absolute top-4 left-4 flex gap-2">
        <div className="bg-black/70 rounded-lg p-2 flex gap-1">
          <button
            onClick={() => handleGizmoChange('translate')}
            className={`px-4 py-2 rounded ${gizmoMode === 'translate' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'} text-white font-medium transition-colors`}
          >
            Translate (1)
          </button>
          <button
            onClick={() => handleGizmoChange('rotate')}
            className={`px-4 py-2 rounded ${gizmoMode === 'rotate' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'} text-white font-medium transition-colors`}
          >
            Rotate (2)
          </button>
          <button
            onClick={() => handleGizmoChange('scale')}
            className={`px-4 py-2 rounded ${gizmoMode === 'scale' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'} text-white font-medium transition-colors`}
          >
            Scale (3)
          </button>
        </div>

        <div className="bg-black/70 rounded-lg p-2 flex gap-1">
          <button
            onClick={handleCoordSpaceToggle}
            className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white font-medium transition-colors"
          >
            {coordSpace === 'world' ? 'World (X)' : 'Local (X)'}
          </button>
        </div>

        <div className="bg-black/70 rounded-lg p-2 flex gap-1">
          <button
            onClick={handleFocus}
            disabled={!selectedObject}
            className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:opacity-50 text-white font-medium transition-colors"
          >
            Focus (F)
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white font-medium transition-colors"
          >
            Reset (R)
          </button>
        </div>
      </div>

      {/* Selection Info */}
      {selectedObject && (
        <div className="absolute top-4 right-4 bg-black/70 rounded-lg p-4 text-white">
          <div className="text-sm font-semibold mb-2">Selected Object</div>
          <div className="text-lg font-bold capitalize">{selectedObject}</div>
        </div>
      )}

      {/* Help Panel */}
      <div className="absolute bottom-4 left-4 bg-black/70 rounded-lg p-4 text-white text-sm">
        <div className="font-semibold mb-2">Controls</div>
        <div className="space-y-1">
          <div><span className="font-bold">1/2/3</span> - Transform modes</div>
          <div><span className="font-bold">X</span> - Toggle World/Local</div>
          <div><span className="font-bold">F</span> - Focus selection</div>
          <div><span className="font-bold">R</span> - Reset camera</div>
          <div><span className="font-bold">Shift</span> - Snap</div>
          <div><span className="font-bold">Ctrl</span> - Non-uniform scale</div>
          <div><span className="font-bold">Drag</span> - Orbit camera</div>
          <div><span className="font-bold">Wheel</span> - Zoom</div>
        </div>
      </div>
    </div>
  );
}