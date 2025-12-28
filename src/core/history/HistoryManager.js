export class HistoryManager {
    constructor() {
        this.undoStack = [];
        this.redoStack = [];
        this.maxHistorySize = 50;
        this.mergeTimeWindow = 500; // ms - commands within this window can be merged
        this.lastCommandTime = 0;
    }

    execute(command) {
        const now = Date.now();
        const timeSinceLastCommand = now - this.lastCommandTime;

        // Try to merge with the last command if it's recent and compatible
        if (
            this.undoStack.length > 0 &&
            timeSinceLastCommand < this.mergeTimeWindow &&
            typeof command.canMergeWith === 'function' &&
            command.canMergeWith(this.undoStack[this.undoStack.length - 1])
        ) {
            // Merge with last command instead of adding new one
            this.undoStack[this.undoStack.length - 1].mergeWith(command);
        } else {
            // Execute and add new command
            command.execute();
            this.undoStack.push(command);

            // Limit history size
            if (this.undoStack.length > this.maxHistorySize) {
                this.undoStack.shift();
            }
        }

        this.redoStack = []; // Clear redo stack when new action is performed
        this.lastCommandTime = now;
    }

    // Execute without adding to history (for undo/redo operations)
    executeWithoutHistory(command) {
        command.execute();
    }

    undo() {
        if (this.undoStack.length === 0) return false;

        const command = this.undoStack.pop();
        command.undo();
        this.redoStack.push(command);
        this.lastCommandTime = Date.now();
        return true;
    }

    redo() {
        if (this.redoStack.length === 0) return false;

        const command = this.redoStack.pop();
        this.executeWithoutHistory(command);
        this.undoStack.push(command);
        this.lastCommandTime = Date.now();
        return true;
    }

    canUndo() {
        return this.undoStack.length > 0;
    }

    canRedo() {
        return this.redoStack.length > 0;
    }

    clear() {
        this.undoStack = [];
        this.redoStack = [];
        this.lastCommandTime = 0;
    }

    getUndoStackSize() {
        return this.undoStack.length;
    }

    getRedoStackSize() {
        return this.redoStack.length;
    }
}