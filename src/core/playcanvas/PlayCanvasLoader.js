export const loadPlayCanvas = () => {
    return new Promise((resolve, reject) => {
        if (window.pc) {
            resolve(window.pc);
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/playcanvas/1.73.4/playcanvas.min.js';
        script.onload = () => resolve(window.pc);
        script.onerror = reject;
        document.head.appendChild(script);
    });
};