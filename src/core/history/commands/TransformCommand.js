export class TransformCommand {
    constructor(entity, transformType, oldValues, newValues) {
        this.entity = entity;
        this.transformType = transformType; // 'translate', 'rotate', 'scale'
        this.oldValues = {
            position: oldValues.position.clone(),
            rotation: oldValues.rotation.clone(),
            scale: oldValues.scale.clone()
        };
        this.newValues = {
            position: newValues.position.clone(),
            rotation: newValues.rotation.clone(),
            scale: newValues.scale.clone()
        };
    }

    execute() {
        // Apply the new transform values
        this.entity.setPosition(this.newValues.position);
        this.entity.setEulerAngles(this.newValues.rotation);
        this.entity.setLocalScale(this.newValues.scale);
    }

    undo() {
        // Restore the old transform values
        this.entity.setPosition(this.oldValues.position);
        this.entity.setEulerAngles(this.oldValues.rotation);
        this.entity.setLocalScale(this.oldValues.scale);
    }

    // Helper method to check if this command can be merged with another
    canMergeWith(other) {
        return (
            other instanceof TransformCommand &&
            this.entity === other.entity &&
            this.transformType === other.transformType
        );
    }

    // Merge with another command (useful for continuous transforms)
    mergeWith(other) {
        // Keep the old start values, update to new end values
        this.newValues = {
            position: other.newValues.position.clone(),
            rotation: other.newValues.rotation.clone(),
            scale: other.newValues.scale.clone()
        };
    }
}