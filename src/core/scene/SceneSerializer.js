export class SceneSerializer {
    constructor(pc, app) {
        this.pc = pc;
        this.app = app;
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
            // Skip camera and lights for now (can be added later)
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
                position: {
                    x: entity.getPosition().x,
                    y: entity.getPosition().y,
                    z: entity.getPosition().z
                },
                rotation: {
                    x: entity.getEulerAngles().x,
                    y: entity.getEulerAngles().y,
                    z: entity.getEulerAngles().z
                },
                scale: {
                    x: entity.getLocalScale().x,
                    y: entity.getLocalScale().y,
                    z: entity.getLocalScale().z
                }
            },
            components: {}
        };

        // Serialize render component
        if (entity.render) {
            data.components.render = {
                type: entity.render.type,
                castShadows: entity.render.castShadows,
                receiveShadows: entity.render.receiveShadows,
                material: this.serializeMaterial(entity.render.meshInstances[0]?.material)
            };
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
    importScene(sceneData, entityFactory, addEntity) {
        // Clear existing entities first (optional)
        // You might want to add a "clear scene" function

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
        // Extract primitive type from name (e.g., "box_1" -> "box")
        const typeMatch = data.name.match(/^([a-z]+)_\d+$/);
        const primitiveType = typeMatch ? typeMatch[1] : 'box';

        // Create entity using factory
        const entity = entityFactory.createEntity(primitiveType, data.transform.position);

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
        if (data.components?.render?.material && entity.render) {
            const matData = data.components.render.material;
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