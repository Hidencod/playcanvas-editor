import { createColorMaterial } from '../../utils/materialFactory';

export class EntityFactory {
    constructor(pc, app) {
        this.pc = pc;
        this.app = app;
        this.entityCounter = {
            box: 0,
            sphere: 0,
            cylinder: 0,
            cone: 0,
            capsule: 0,
            plane: 0
        };
    }

    createEntity(type, position = { x: 0, y: 0, z: 0 }) {
        const pc = this.pc;
        this.entityCounter[type]++;
        const name = `${type}_${this.entityCounter[type]}`;

        const entity = new pc.Entity(name);

        // Default colors for different shapes
        const colorMap = {
            box: new pc.Color(0.8, 1, 1),
            sphere: new pc.Color(1, 0.8, 1),
            cylinder: new pc.Color(1, 1, 0.8),
            cone: new pc.Color(1, 1, 0.8),
            capsule: new pc.Color(0.8, 0.8, 1),
            plane: new pc.Color(0.9, 0.9, 0.9)
        };

        entity.addComponent('render', {
            type: type,
            material: createColorMaterial(pc, colorMap[type] || new pc.Color(1, 1, 1))
        });

        entity.setPosition(position.x, position.y, position.z);

        // Special scaling for certain shapes
        if (type === 'cone') {
            entity.setLocalScale(1.5, 2.25, 1.5);
        }

        this.app.root.addChild(entity);
        return entity;
    }

    createLight(type = 'directional') {
        const pc = this.pc;
        const light = new pc.Entity('light');
        light.addComponent('light', {
            type: type,
            intensity: 1
        });
        light.setEulerAngles(45, 30, 0);
        this.app.root.addChild(light);
        return light;
    }

    createCamera() {
        const pc = this.pc;
        const camera = new pc.Entity('camera');
        camera.addComponent('camera', {
            clearColor: new pc.Color(0.1, 0.1, 0.1),
            farClip: 1000
        });
        const cameraOffset = 8;
        camera.setPosition(cameraOffset, cameraOffset, cameraOffset);
        camera.lookAt(0, 0, 0);
        this.app.root.addChild(camera);
        return camera;
    }
}