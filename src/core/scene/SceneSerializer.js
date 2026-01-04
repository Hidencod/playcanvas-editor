export class SceneSerializer {
    constructor(pc, app, modelLoader, assetManager = null) {
        this.pc = pc;
        this.app = app;
        this.modelLoader = modelLoader;
        this.assetManager = assetManager;
    }

    /**
     * Export the scene to JSON format
     */
    exportScene(entities) {
        const sceneData = {
            version: '1.0.0',
            timestamp: new Date().toISOString(),
            entities: [],
            settings: {
                ambientLight: {
                    r: this.app.scene.ambientLight.r,
                    g: this.app.scene.ambientLight.g,
                    b: this.app.scene.ambientLight.b
                }
            }
        };

        // Serialize each entity
        entities.forEach(({ entity }) => {
            // Skip camera and lights
            if (entity.name === 'camera' || entity.name === 'light') {
                return;
            }

            const entityData = this.serializeEntity(entity);
            if (entityData) {
                sceneData.entities.push(entityData);
            }
        });

        return sceneData;
    }

    /**
     * Serialize a single entity
     */
    serializeEntity(entity) {
        const data = {
            name: entity.name,
            enabled: entity.enabled,
            transform: {
                position: entity.getPosition().clone(),
                rotation: entity.getEulerAngles().clone(),
                scale: entity.getLocalScale().clone()
            },
            components: {}
        };

        // Add objectId if exists
        if (entity.objectId) {
            data.objectId = entity.objectId;
        }

        // Custom model (GLTF/GLB)
        if (entity.modelFileName) {
            data.isCustomModel = true;
            data.modelFile = entity.modelFileName;

            // Store assetId if available (for IndexedDB lookup)
            if (entity.assetId) {
                data.assetId = entity.assetId;
            }

            data.components.render = {
                type: 'model',
                modelFile: entity.modelFileName,
                assetId: entity.assetId || null,
                castShadows: true,
                receiveShadows: true
            };

            return data;
        }

        // Primitive entities
        if (entity.render) {
            const renderType = entity.render.type;

            const primitiveTypes = ['box', 'sphere', 'cylinder', 'cone', 'capsule', 'plane'];
            const isPrimitive = primitiveTypes.includes(renderType);

            if (isPrimitive) {
                data.components.render = {
                    type: renderType,
                    castShadows: entity.render.castShadows,
                    receiveShadows: entity.render.receiveShadows,
                    material: this.serializeMaterial(
                        entity.render.meshInstances[0]?.material
                    )
                };
            }
        }

        return data;
    }

    /**
     * Serialize material data
     */
    serializeMaterial(material) {
        if (!material) return null;

        return {
            diffuse: {
                r: material.diffuse.r,
                g: material.diffuse.g,
                b: material.diffuse.b
            },
            emissive: material.emissive ? {
                r: material.emissive.r,
                g: material.emissive.g,
                b: material.emissive.b
            } : null,
            opacity: material.opacity,
            metalness: material.metalness,
            shininess: material.shininess
        };
    }

    /**
     * Import scene from JSON
     */
    async importScene(sceneData, entityFactory, addEntity) {
        // Apply scene settings
        if (sceneData.settings?.ambientLight) {
            const amb = sceneData.settings.ambientLight;
            this.app.scene.ambientLight = new this.pc.Color(amb.r, amb.g, amb.b);
        }

        // Create entities
        const createdEntities = [];

        for (const entityData of sceneData.entities) {
            try {
                const entity = await this.deserializeEntity(entityData, entityFactory);
                if (entity) {
                    addEntity(entity);
                    createdEntities.push(entity);
                }
            } catch (error) {
                console.error(`Failed to load entity ${entityData.name}:`, error);
            }
        }

        return createdEntities;
    }

    /**
     * Deserialize a single entity
     */
    async deserializeEntity(data, entityFactory) {
        // Check if it's a custom model
        if (data.isCustomModel && data.assetId && this.assetManager) {
            try {
                console.log(`📦 Loading custom model from AssetManager: ${data.assetId}`);

                // Get the file from AssetManager
                const file = await this.assetManager.getAssetAsFile(data.assetId);

                // Load the model
                const entity = await this.modelLoader.loadModelFromFile(file, data.name);

                // Restore assetId
                entity.assetId = data.assetId;

                // Restore objectId if exists
                if (data.objectId) {
                    entity.objectId = data.objectId;
                }

                // Apply transform
                entity.setPosition(
                    data.transform.position.x,
                    data.transform.position.y,
                    data.transform.position.z
                );
                entity.setEulerAngles(
                    data.transform.rotation.x,
                    data.transform.rotation.y,
                    data.transform.rotation.z
                );
                entity.setLocalScale(
                    data.transform.scale.x,
                    data.transform.scale.y,
                    data.transform.scale.z
                );

                console.log(`✅ Custom model loaded: ${data.name}`);
                return entity;

            } catch (error) {
                console.error(`❌ Failed to load custom model from AssetManager: ${data.assetId}`, error);
                console.warn(`Custom model ${data.modelFile} not found in AssetManager - skipping`);
                return null;
            }
        }

        // Check if it's a custom model without assetId (old format)
        if (data.isCustomModel && data.modelFile && !data.assetId) {
            console.warn(`⚠️ Custom model ${data.modelFile} has no assetId - please re-import the model through Asset Browser`);
            return null;
        }

        // Extract primitive type from render component
        const renderData = data.components?.render;
        if (!renderData || !renderData.type) return null;

        const primitiveType = renderData.type;

        // Create entity using factory
        const entity = entityFactory.createEntity(primitiveType, data.transform.position);
        entity.name = data.name;

        // Restore objectId if exists
        if (data.objectId) {
            entity.objectId = data.objectId;
        }

        // Apply transform
        entity.setPosition(
            data.transform.position.x,
            data.transform.position.y,
            data.transform.position.z
        );
        entity.setEulerAngles(
            data.transform.rotation.x,
            data.transform.rotation.y,
            data.transform.rotation.z
        );
        entity.setLocalScale(
            data.transform.scale.x,
            data.transform.scale.y,
            data.transform.scale.z
        );

        // Apply material if exists
        if (renderData.material && entity.render) {
            const matData = renderData.material;
            const material = new this.pc.StandardMaterial();

            material.diffuse = new this.pc.Color(
                matData.diffuse.r,
                matData.diffuse.g,
                matData.diffuse.b
            );

            if (matData.emissive) {
                material.emissive = new this.pc.Color(
                    matData.emissive.r,
                    matData.emissive.g,
                    matData.emissive.b
                );
            }

            material.update();

            entity.render.meshInstances.forEach(mi => {
                mi.material = material;
            });
        }

        return entity;
    }

    /**
     * Export to downloadable JSON file
     */
    exportToFile(entities, filename = 'scene.json') {
        const sceneData = this.exportScene(entities);
        const jsonString = JSON.stringify(sceneData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    /**
     * Import from file
     */
    async importFromFile(file, entityFactory, addEntity) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = async (e) => {
                try {
                    const sceneData = JSON.parse(e.target.result);
                    const entities = await this.importScene(sceneData, entityFactory, addEntity);
                    resolve(entities);
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }
}