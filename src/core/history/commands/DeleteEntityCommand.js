export class DeleteEntityCommand {
    constructor(entity, onAdd, onRemove) {
        this.entity = entity;
        this.parent = entity.parent;
        this.onAdd = onAdd;
        this.onRemove = onRemove;

        // Store transform state
        this.savedTransform = {
            position: entity.getPosition().clone(),
            rotation: entity.getEulerAngles().clone(),
            scale: entity.getLocalScale().clone()
        };
    }

    execute() {
        // Remove from scene
        if (this.entity.parent) {
            this.entity.parent.removeChild(this.entity);
            this.onRemove(this.entity.name);
        }
    }

    undo() {
        // Re-add to scene with saved transform
        if (this.parent) {
            this.parent.addChild(this.entity);
            this.entity.setPosition(this.savedTransform.position);
            this.entity.setEulerAngles(this.savedTransform.rotation);
            this.entity.setLocalScale(this.savedTransform.scale);
            this.onAdd(this.entity);
        }
    }
}