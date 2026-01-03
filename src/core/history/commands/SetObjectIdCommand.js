// core/history/commands/SetObjectIdCommand.js

export class SetObjectIdCommand {
    constructor(entity, newObjectId, oldObjectId = null) {
        this.entity = entity;
        this.newObjectId = newObjectId;
        this.oldObjectId = oldObjectId;
    }

    execute() {
        // Set the new objectId
        this.entity.objectId = this.newObjectId;
    }

    undo() {
        // Restore the old objectId
        if (this.oldObjectId === null || this.oldObjectId === undefined) {
            delete this.entity.objectId;
        } else {
            this.entity.objectId = this.oldObjectId;
        }
    }
}