'use strict';

const thresholdSlider = document.querySelector('#threshold');
const thresholdValue = document.querySelector('#thresholdValue');

const cannyVideo = window.video;
const cannyCanvas = window.liveCanvas;
const cannyCtx = cannyCanvas.getContext('2d');

let edgeThreshold = 50;

// Canny Edge Detection
function cannyEdgeDetection(imageData, threshold) {
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;
    const gray = new Uint8Array(width * height);
    
    // Convert to grayscale
    for (let i = 0; i < data.length; i += 4) {
        const idx = i / 4;
        gray[idx] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    }
    
    // Gaussian blur (3x3 kernel)
    const blurred = new Uint8Array(width * height);
    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const idx = y * width + x;
            blurred[idx] = Math.floor((
                gray[idx - width - 1] + 2 * gray[idx - width] + gray[idx - width + 1] +
                2 * gray[idx - 1] + 4 * gray[idx] + 2 * gray[idx + 1] +
                gray[idx + width - 1] + 2 * gray[idx + width] + gray[idx + width + 1]
            ) / 16);
        }
    }
    
    // Sobel edge detection
    const gradientMag = new Uint8Array(width * height);
    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const idx = y * width + x;
            
            const gx = (
                -blurred[idx - width - 1] + blurred[idx - width + 1] +
                -2 * blurred[idx - 1] + 2 * blurred[idx + 1] +
                -blurred[idx + width - 1] + blurred[idx + width + 1]
            );
            
            const gy = (
                -blurred[idx - width - 1] - 2 * blurred[idx - width] - blurred[idx - width + 1] +
                blurred[idx + width - 1] + 2 * blurred[idx + width] + blurred[idx + width + 1]
            );
            
            gradientMag[idx] = Math.min(255, Math.sqrt(gx * gx + gy * gy));
        }
    }
    
    // Apply threshold and create output
    const edges = new Uint8ClampedArray(width * height * 4);
    for (let i = 0; i < gradientMag.length; i++) {
        const value = gradientMag[i] > threshold ? 255 : 0;
        edges[i * 4] = value;
        edges[i * 4 + 1] = value;
        edges[i * 4 + 2] = value;
        edges[i * 4 + 3] = 255;
    }
    
    return new ImageData(edges, width, height);
}

// Real-time Canny Edge processing
function processCannyEdge() {
    if (window.cannyEnabled && cannyVideo.videoWidth && cannyVideo.videoHeight) {
        cannyCtx.drawImage(cannyVideo, 0, 0, cannyCanvas.width, cannyCanvas.height);
        const imageData = cannyCtx.getImageData(0, 0, cannyCanvas.width, cannyCanvas.height);
        const filtered = cannyEdgeDetection(imageData, edgeThreshold);
        cannyCtx.putImageData(filtered, 0, 0);
    }
    requestAnimationFrame(processCannyEdge);
}

if (thresholdSlider) {
    thresholdSlider.oninput = function() {
        edgeThreshold = parseInt(thresholdSlider.value);
        window.edgeThreshold = edgeThreshold;
        thresholdValue.textContent = edgeThreshold;
    };
}

// Start processing when video is ready
if (cannyVideo) {
    cannyVideo.addEventListener('loadedmetadata', function() {
        processCannyEdge();
    });
    if (cannyVideo.readyState >= 2) {
        processCannyEdge();
    }
}