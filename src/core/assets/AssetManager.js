/**
 * Asset Manager using IndexedDB for persistent storage
 */
export class AssetManager {
    constructor() {
        this.db = null;
        this.dbName = 'PlayCanvasEditorDB';
        this.dbVersion = 1;
        this.assets = new Map();
    }

    /**
     * Initialize the database
     */
    async initialize() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                reject(new Error('Failed to open database'));
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log('✅ Asset database initialized');
                this.loadAssetIndex();
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create object stores
                if (!db.objectStoreNames.contains('assets')) {
                    const assetStore = db.createObjectStore('assets', { keyPath: 'id' });
                    assetStore.createIndex('name', 'name', { unique: false });
                    assetStore.createIndex('type', 'type', { unique: false });
                }

                if (!db.objectStoreNames.contains('projects')) {
                    db.createObjectStore('projects', { keyPath: 'id' });
                }
            };
        });
    }

    /**
     * Load asset index into memory
     */
    async loadAssetIndex() {
        const transaction = this.db.transaction(['assets'], 'readonly');
        const store = transaction.objectStore('assets');
        const request = store.getAll();

        return new Promise((resolve, reject) => {
            request.onsuccess = () => {
                request.result.forEach(asset => {
                    this.assets.set(asset.id, {
                        id: asset.id,
                        name: asset.name,
                        type: asset.type,
                        size: asset.size,
                        uploadDate: asset.uploadDate
                    });
                });
                console.log(`📦 Loaded ${this.assets.size} assets from database`);
                resolve();
            };
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Store an asset (model file) in IndexedDB
     */
    async storeAsset(file, metadata = {}) {
        const id = this.generateId();

        // Read file as ArrayBuffer
        const arrayBuffer = await this.readFileAsArrayBuffer(file);

        const asset = {
            id: id,
            name: file.name,
            type: file.type || 'model/gltf-binary',
            size: file.size,
            data: arrayBuffer,
            uploadDate: new Date().toISOString(),
            metadata: metadata
        };

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['assets'], 'readwrite');
            const store = transaction.objectStore('assets');
            const request = store.add(asset);

            request.onsuccess = () => {
                this.assets.set(id, {
                    id: asset.id,
                    name: asset.name,
                    type: asset.type,
                    size: asset.size,
                    uploadDate: asset.uploadDate
                });
                console.log(`✅ Asset stored: ${file.name} (${id})`);
                resolve(id);
            };

            request.onerror = () => {
                console.error('Failed to store asset:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Retrieve an asset from IndexedDB
     */
    async getAsset(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['assets'], 'readonly');
            const store = transaction.objectStore('assets');
            const request = store.get(id);

            request.onsuccess = () => {
                if (request.result) {
                    resolve(request.result);
                } else {
                    reject(new Error(`Asset not found: ${id}`));
                }
            };

            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Get asset as a File object
     */
    async getAssetAsFile(id) {
        const asset = await this.getAsset(id);
        const blob = new Blob([asset.data], { type: asset.type });
        return new File([blob], asset.name, { type: asset.type });
    }

    /**
     * Get all assets
     */
    getAllAssets() {
        return Array.from(this.assets.values());
    }

    /**
     * Delete an asset
     */
    async deleteAsset(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['assets'], 'readwrite');
            const store = transaction.objectStore('assets');
            const request = store.delete(id);

            request.onsuccess = () => {
                this.assets.delete(id);
                console.log(`🗑️ Asset deleted: ${id}`);
                resolve();
            };

            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Save project data
     */
    async saveProject(projectName, sceneData) {
        const project = {
            id: projectName,
            name: projectName,
            sceneData: sceneData,
            savedDate: new Date().toISOString()
        };

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['projects'], 'readwrite');
            const store = transaction.objectStore('projects');
            const request = store.put(project);

            request.onsuccess = () => {
                console.log(`💾 Project saved: ${projectName}`);
                resolve();
            };

            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Load project data
     */
    async loadProject(projectName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['projects'], 'readonly');
            const store = transaction.objectStore('projects');
            const request = store.get(projectName);

            request.onsuccess = () => {
                if (request.result) {
                    console.log(`📂 Project loaded: ${projectName}`);
                    resolve(request.result);
                } else {
                    reject(new Error(`Project not found: ${projectName}`));
                }
            };

            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Get all projects
     */
    async getAllProjects() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['projects'], 'readonly');
            const store = transaction.objectStore('projects');
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Helper: Read file as ArrayBuffer
     */
    readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsArrayBuffer(file);
        });
    }

    /**
     * Generate unique ID
     */
    generateId() {
        return `asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get database size info
     */
    async getStorageInfo() {
        if (navigator.storage && navigator.storage.estimate) {
            const estimate = await navigator.storage.estimate();
            return {
                used: estimate.usage,
                available: estimate.quota,
                usedMB: (estimate.usage / (1024 * 1024)).toFixed(2),
                availableMB: (estimate.quota / (1024 * 1024)).toFixed(2)
            };
        }
        return null;
    }
}