export class CreateEntityCommand {
    constructor(entityFactory, type, position, onAdd, onRemove) {
        this.entityFactory = entityFactory;
        this.type = type;
        this.position = position;
        this.entity = null;
        this.onAdd = onAdd;
        this.onRemove = onRemove;
    }

    execute() {
        if (!this.entity) {
            // First time creating
            this.entity = this.entityFactory.createEntity(this.type, this.position);
            this.onAdd(this.entity);
        } else {
            // Re-adding (redo)
            this.entityFactory.app.root.addChild(this.entity);
            this.onAdd(this.entity);
        }
    }

    undo() {
        if (this.entity) {
            this.entityFactory.app.root.removeChild(this.entity);
            this.onRemove(this.entity.name);
        }
    }
}