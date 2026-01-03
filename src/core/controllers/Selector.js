export class Selector {
    constructor(pc, app, cameraComponent, layers = []) {
        this.pc = pc;
        this._app = app;
        this._camera = cameraComponent;
        this._scene = app.scene;
        this._picker = null;
        this._layers = layers;
        this._start = new pc.Vec2();
        this._epsilon = 1;
        this._listeners = {};
        this._canvas = app.graphicsDevice.canvas;

        this._onPointerDown = this._onPointerDown.bind(this);
        this._onPointerUp = this._onPointerUp.bind(this);

        // Listen only on canvas
        this._canvas.addEventListener('pointerdown', this._onPointerDown);
        this._canvas.addEventListener('pointerup', this._onPointerUp);
    }

    on(event, callback) {
        if (!this._listeners[event]) {
            this._listeners[event] = [];
        }
        this._listeners[event].push(callback);
    }

    fire(event, ...args) {
        if (this._listeners[event]) {
            this._listeners[event].forEach(cb => cb(...args));
        }
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
            this._picker = new this.pc.Picker(this._app, device.canvas.clientWidth, device.canvas.clientHeight);
        }

        const device = this._app.graphicsDevice;
        this._picker.resize(device.canvas.clientWidth, device.canvas.clientHeight);
        this._picker.prepare(this._camera, this._scene, this._layers);

        const selection = await this._picker.getSelection(e.clientX - 1, e.clientY - 1, 2, 2);

        if (!selection[0]) {
            this.fire('deselect');
            return;
        }

        // Get the top-level selectable entity (not internal mesh parts)
        let selectedNode = selection[0].node;

        // Walk up the hierarchy to find a meaningful entity
        // Skip internal mesh parts and go to the parent model
        while (selectedNode && selectedNode.parent && selectedNode.parent.name !== 'Root') {
            // If this entity has a modelFileName, it's the main model entity
            if (selectedNode.modelFileName ||
                (selectedNode.render && selectedNode.render.type !== 'asset')) {
                break;
            }
            selectedNode = selectedNode.parent;
        }

        this.fire('select', selectedNode, !e.ctrlKey && !e.metaKey);
    }

    destroy() {
        this._canvas.removeEventListener('pointerdown', this._onPointerDown);
        this._canvas.removeEventListener('pointerup', this._onPointerUp);
    }
}