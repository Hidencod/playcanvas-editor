export class GizmoHandler {
    constructor(pc, app, cameraComponent) {
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