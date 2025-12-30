export class ModelLoader {
    constructor(pc, app) {
        this.pc = pc;
        this.app = app;
        this.loadedModels = new Map();
    }

    /**
     * Load a 3D model from a file
     */
    async loadModelFromFile(file, name = null) {
        const fileName = file.name;
        const extension = fileName.split('.').pop().toLowerCase();
        const entityName = name || fileName.replace(/\.[^/.]+$/, '');

        try {
            switch (extension) {
                case 'glb':
                case 'gltf':
                    return await this.loadGLTF(file, entityName);
                case 'obj':
                    return await this.loadOBJ(file, entityName);
                default:
                    throw new Error(`Unsupported file format: ${extension}`);
            }
        } catch (error) {
            console.error('Failed to load model:', error);
            throw error;
        }
    }

    /**
     * Load GLTF/GLB model - FIXED VERSION
     */
    async loadGLTF(file, name) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = async (e) => {
                try {
                    const arrayBuffer = e.target.result;

                    // Create a blob URL for the file
                    const blob = new Blob([arrayBuffer], { type: 'model/gltf-binary' });
                    const blobUrl = URL.createObjectURL(blob);

                    // Create container asset
                    const asset = new this.pc.Asset(name, 'container', {
                        url: blobUrl,
                        filename: file.name
                    });

                    // Add to asset registry
                    this.app.assets.add(asset);

                    // Load the asset
                    asset.once('load', (loadedAsset) => {
                        try {
                            // Instantiate the model
                            const resource = loadedAsset.resource;
                            const entity = resource.instantiateRenderEntity({
                                castShadows: true,
                                receiveShadows: true
                            });

                            entity.name = name;

                            // Store the original filename for export
                            entity.modelFileName = file.name; // ADD THIS LINE

                            // Center and scale the model
                            this.centerAndScaleModel(entity);

                            // Add to scene
                            this.app.root.addChild(entity);

                            // Cache the asset with filename
                            this.loadedModels.set(name, {
                                asset: loadedAsset,
                                blobUrl: blobUrl,
                                originalFileName: file.name // ADD THIS LINE
                            });

                            console.log(`✅ Model loaded successfully: ${name} (${entity.modelFileName})`);
                            resolve(entity);

                        } catch (err) {
                            console.error('Error instantiating model:', err);
                            reject(new Error(`Failed to instantiate model: ${err.message}`));
                        }
                    });

                    asset.once('error', (err, asset) => {
                        console.error('Asset loading error:', err);
                        URL.revokeObjectURL(blobUrl);
                        reject(new Error(`Failed to load GLTF asset: ${err}`));
                    });

                    // Start loading
                    this.app.assets.load(asset);

                } catch (error) {
                    console.error('Error processing file:', error);
                    reject(error);
                }
            };

            reader.onerror = () => {
                console.error('FileReader error');
                reject(new Error('Failed to read file'));
            };

            reader.readAsArrayBuffer(file);
        });
    }
    /**
     * Load OBJ model
     */
    async loadOBJ(file, name) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const objText = e.target.result;

                    // Parse OBJ format
                    const entity = this.parseOBJ(objText, name);

                    if (entity) {
                        // Store the original filename for export
                        entity.modelFileName = file.name; // ADD THIS LINE

                        this.centerAndScaleModel(entity);
                        this.app.root.addChild(entity);
                        resolve(entity);
                    } else {
                        reject(new Error('Failed to parse OBJ file'));
                    }

                } catch (error) {
                    console.error('OBJ parsing error:', error);
                    reject(error);
                }
            };

            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    /**
     * Parse OBJ text format
     */
    parseOBJ(objText, name) {
        const lines = objText.split('\n');
        const vertices = [];
        const normals = [];
        const uvs = [];
        const faces = [];

        // Parse OBJ format
        for (let line of lines) {
            line = line.trim();
            if (!line || line.startsWith('#')) continue;

            const parts = line.split(/\s+/);

            switch (parts[0]) {
                case 'v': // Vertex
                    vertices.push(
                        parseFloat(parts[1]) || 0,
                        parseFloat(parts[2]) || 0,
                        parseFloat(parts[3]) || 0
                    );
                    break;
                case 'vn': // Normal
                    normals.push(
                        parseFloat(parts[1]) || 0,
                        parseFloat(parts[2]) || 0,
                        parseFloat(parts[3]) || 0
                    );
                    break;
                case 'vt': // UV
                    uvs.push(
                        parseFloat(parts[1]) || 0,
                        parseFloat(parts[2]) || 0
                    );
                    break;
                case 'f': // Face
                    const face = [];
                    for (let i = 1; i < parts.length; i++) {
                        const indices = parts[i].split('/');
                        face.push({
                            v: parseInt(indices[0]) - 1,
                            vt: indices[1] ? parseInt(indices[1]) - 1 : -1,
                            vn: indices[2] ? parseInt(indices[2]) - 1 : -1
                        });
                    }
                    if (face.length >= 3) {
                        faces.push(face);
                    }
                    break;
            }
        }

        // Validate parsed data
        if (vertices.length === 0) {
            throw new Error('No vertices found in OBJ file');
        }

        if (faces.length === 0) {
            throw new Error('No faces found in OBJ file');
        }

        console.log(`Parsed OBJ: ${vertices.length / 3} vertices, ${faces.length} faces`);

        // Create entity with mesh
        const entity = new this.pc.Entity(name);
        const mesh = this.createMeshFromOBJ(vertices, faces, normals, uvs);

        // Create material
        const material = new this.pc.StandardMaterial();
        material.diffuse = new this.pc.Color(0.8, 0.8, 0.8);
        material.update();

        // Add render component
        entity.addComponent('render', {
            type: 'asset',
            meshInstances: [new this.pc.MeshInstance(mesh, material)]
        });

        return entity;
    }

    /**
     * Create PlayCanvas mesh from OBJ data
     */
    createMeshFromOBJ(vertices, faces, normals, uvs) {
        const positions = [];
        const indices = [];
        const meshNormals = [];
        const meshUvs = [];

        const vertexMap = new Map();
        let indexCount = 0;

        // Process each face
        for (const face of faces) {
            // Triangulate face if it has more than 3 vertices
            for (let i = 1; i < face.length - 1; i++) {
                const vertices = [face[0], face[i], face[i + 1]];

                for (const vertex of vertices) {
                    const key = `${vertex.v}_${vertex.vt}_${vertex.vn}`;

                    if (!vertexMap.has(key)) {
                        // Add new vertex
                        const vIdx = vertex.v * 3;
                        positions.push(
                            vertices[vIdx] || 0,
                            vertices[vIdx + 1] || 0,
                            vertices[vIdx + 2] || 0
                        );

                        // Normal
                        if (vertex.vn >= 0 && normals.length > vertex.vn * 3) {
                            const nIdx = vertex.vn * 3;
                            meshNormals.push(
                                normals[nIdx] || 0,
                                normals[nIdx + 1] || 1,
                                normals[nIdx + 2] || 0
                            );
                        } else {
                            meshNormals.push(0, 1, 0); // Default normal
                        }

                        // UV
                        if (vertex.vt >= 0 && uvs.length > vertex.vt * 2) {
                            const uvIdx = vertex.vt * 2;
                            meshUvs.push(
                                uvs[uvIdx] || 0,
                                uvs[uvIdx + 1] || 0
                            );
                        } else {
                            meshUvs.push(0, 0); // Default UV
                        }

                        vertexMap.set(key, indexCount);
                        indices.push(indexCount);
                        indexCount++;
                    } else {
                        indices.push(vertexMap.get(key));
                    }
                }
            }
        }

        // Create mesh
        const mesh = new this.pc.Mesh(this.app.graphicsDevice);
        mesh.clear(true, true);

        mesh.setPositions(positions);
        mesh.setNormals(meshNormals);

        if (meshUvs.length > 0) {
            mesh.setUvs(0, meshUvs);
        }

        mesh.setIndices(indices);
        mesh.update(this.pc.PRIMITIVE_TRIANGLES);

        return mesh;
    }

    /**
     * Center and scale model to reasonable size
     */
    centerAndScaleModel(entity) {
        // Wait a frame for render component to initialize
        setTimeout(() => {
            if (!entity.render || !entity.render.meshInstances.length) return;

            // Calculate bounding box
            let minX = Infinity, minY = Infinity, minZ = Infinity;
            let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

            const traverse = (node) => {
                if (node.render && node.render.meshInstances) {
                    node.render.meshInstances.forEach(mi => {
                        const aabb = mi.aabb;
                        const min = aabb.getMin();
                        const max = aabb.getMax();

                        minX = Math.min(minX, min.x);
                        minY = Math.min(minY, min.y);
                        minZ = Math.min(minZ, min.z);
                        maxX = Math.max(maxX, max.x);
                        maxY = Math.max(maxY, max.y);
                        maxZ = Math.max(maxZ, max.z);
                    });
                }

                node.children.forEach(child => traverse(child));
            };

            traverse(entity);

            // Calculate center
            const centerX = (minX + maxX) / 2;
            const centerY = (minY + maxY) / 2;
            const centerZ = (minZ + maxZ) / 2;

            // Calculate size
            const sizeX = maxX - minX;
            const sizeY = maxY - minY;
            const sizeZ = maxZ - minZ;
            const maxSize = Math.max(sizeX, sizeY, sizeZ);

            // Scale to fit in 3 unit cube (if larger)
            const targetSize = 3;
            if (maxSize > targetSize) {
                const scale = targetSize / maxSize;
                entity.setLocalScale(scale, scale, scale);
            }

            // Center the model
            entity.setPosition(-centerX, -centerY, -centerZ);

            console.log(`Model bounds: size=${maxSize.toFixed(2)}, center=(${centerX.toFixed(2)}, ${centerY.toFixed(2)}, ${centerZ.toFixed(2)})`);
        }, 100);
    }

    /**
     * Load model from URL
     */
    async loadModelFromURL(url, name = null) {
        const fileName = url.split('/').pop();
        const entityName = name || fileName.replace(/\.[^/.]+$/, '');

        return new Promise((resolve, reject) => {
            const asset = new this.pc.Asset(entityName, 'container', { url });

            this.app.assets.add(asset);

            asset.once('load', (loadedAsset) => {
                try {
                    const entity = loadedAsset.resource.instantiateRenderEntity();
                    entity.name = entityName;

                    this.centerAndScaleModel(entity);
                    this.app.root.addChild(entity);
                    this.loadedModels.set(entityName, { asset: loadedAsset });

                    resolve(entity);
                } catch (err) {
                    reject(new Error(`Failed to instantiate model: ${err.message}`));
                }
            });

            asset.once('error', (err) => {
                reject(new Error(`Failed to load model from URL: ${err}`));
            });

            this.app.assets.load(asset);
        });
    }

    /**
     * Clone a loaded model
     */
    cloneModel(originalEntity, newName) {
        const clone = originalEntity.clone();
        clone.name = newName || `${originalEntity.name}_clone`;
        this.app.root.addChild(clone);
        return clone;
    }

    /**
     * Get all loaded models
     */
    getLoadedModels() {
        return Array.from(this.loadedModels.keys());
    }

    /**
     * Remove cached model and revoke blob URLs
     */
    removeModel(name) {
        const data = this.loadedModels.get(name);
        if (data) {
            if (data.blobUrl) {
                URL.revokeObjectURL(data.blobUrl);
            }
            if (data.asset) {
                this.app.assets.remove(data.asset);
            }
            this.loadedModels.delete(name);
        }
    }

    /**
     * Clean up all resources
     */
    destroy() {
        this.loadedModels.forEach((data, name) => {
            this.removeModel(name);
        });
        this.loadedModels.clear();
    }
}