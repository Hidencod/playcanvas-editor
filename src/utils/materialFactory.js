export const createColorMaterial = (pc, color) => {
    const material = new pc.StandardMaterial();
    material.diffuse = color;
    material.update();
    return material;
};

export const getRandomColor = (pc) => {
    return new pc.Color(
        Math.random() * 0.5 + 0.5,
        Math.random() * 0.5 + 0.5,
        Math.random() * 0.5 + 0.5
    );
};