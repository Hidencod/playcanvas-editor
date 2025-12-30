export class SceneSerializer {
    constructor(pc, app, modelLoader) {
        this.pc = pc;
        this.app = app;
        this.modelLoader = modelLoader;
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

        // ✅ GLTF / Custom model root (NO render on root)
        if (entity.modelFileName) {
            data.isCustomModel = true;
            data.modelFile = entity.modelFileName;

            data.components.render = {
                type: 'model',
                modelFile: entity.modelFileName,
                castShadows: true,
                receiveShadows: true
            };

            return data; // ⛔ stop here — DO NOT access entity.render
        }

        // ✅ Primitive / single-mesh entities
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

    hasRenderComponent(entity) {
        if (entity.render) return true;

        for (const child of entity.children) {
            if (this.hasRenderComponent(child)) return true;
        }
        return false;
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
    importScene(sceneData, entityFactory, addEntity) {
        // Apply scene settings
        if (sceneData.settings?.ambientLight) {
            const amb = sceneData.settings.ambientLight;
            this.app.scene.ambientLight = new this.pc.Color(amb.r, amb.g, amb.b);
        }

        // Create entities
        const createdEntities = [];
        sceneData.entities.forEach(entityData => {
            const entity = this.deserializeEntity(entityData, entityFactory);
            if (entity) {
                addEntity(entity);
                createdEntities.push(entity);
            }
        });

        return createdEntities;
    }

    /**
     * Deserialize a single entity
     */
    deserializeEntity(data, entityFactory) {
        // Check if it's a custom model
        if (data.isCustomModel && data.modelFile) {
            // For custom models in the React editor, we can't load them here
            // This will be handled in Construct3
            console.warn(`Custom model detected: ${data.modelFile} - Load this in Construct3 from project files`);
            return null;
        }

        // Extract primitive type from render component
        const renderData = data.components?.render;
        if (!renderData || !renderData.type) return null;

        const primitiveType = renderData.type;

        // Create entity using factory
        const entity = entityFactory.createEntity(primitiveType, data.transform.position);
        entity.name = data.name;

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
    importFromFile(file, entityFactory, addEntity) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const sceneData = JSON.parse(e.target.result);
                    const entities = this.importScene(sceneData, entityFactory, addEntity);
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