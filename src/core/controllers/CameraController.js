export class CameraController {
    constructor(pc, cameraEntity, canvas) {
        this.pc = pc;
        this.camera = cameraEntity;
        this.canvas = canvas; // Store canvas reference
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

        // Listen on canvas only
        this.canvas.addEventListener('mousedown', this._onMouseDown);
        window.addEventListener('mousemove', this._onMouseMove); // Keep on window for dragging
        window.addEventListener('mouseup', this._onMouseUp);
        this.canvas.addEventListener('wheel', this._onWheel);

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
        const y = -this.distance * Math.sin(pitchRad);
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
        const dir = new this.pc.Vec3().sub2(position, point).normalize();
        this.distance = position.distance(point);

        this.yaw = Math.atan2(dir.x, dir.z) * 180 / Math.PI;
        this.pitch = Math.asin(dir.y) * 180 / Math.PI;

        this.updatePosition();
    }

    destroy() {
        this.canvas.removeEventListener('mousedown', this._onMouseDown);
        window.removeEventListener('mousemove', this._onMouseMove);
        window.removeEventListener('mouseup', this._onMouseUp);
        this.canvas.removeEventListener('wheel', this._onWheel);
    }
}