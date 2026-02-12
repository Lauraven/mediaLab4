'use strict';

const snapshotButton = document.querySelector('button#snapshot');
const filterSelect = document.querySelector('select#filter');
const thresholdSlider = document.querySelector('#threshold');
const thresholdValue = document.querySelector('#thresholdValue');

// Variables in global scope
const video = window.video = document.querySelector('video');
const canvas = window.canvas = document.querySelector('canvas');
canvas.width = 480;
canvas.height = 360;

const ctx = canvas.getContext('2d');
let edgeThreshold = 50;

// Canny Edge Detection implementation
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
    if (video.videoWidth && video.videoHeight) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const filtered = cannyEdgeDetection(imageData, edgeThreshold);
        ctx.putImageData(filtered, 0, 0);
    }
    requestAnimationFrame(processCannyEdge);
}

snapshotButton.onclick = function() {
    canvas.className = filterSelect.value;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
};

filterSelect.onchange = function() {
    video.className = filterSelect.value;
};

thresholdSlider.oninput = function() {
    edgeThreshold = parseInt(thresholdSlider.value);
    thresholdValue.textContent = edgeThreshold;
};

const constraints = {
    audio: false,
    video: true
};

function handleSuccess(stream) {
    video.srcObject = stream;
    video.onloadedmetadata = function() {
        processCannyEdge();
    };
}

function handleError(error) {
    console.log('navigator.MediaDevices.getUserMedia error: ', error.message, error.name);
}

navigator.mediaDevices.getUserMedia(constraints).then(handleSuccess).catch(handleError);