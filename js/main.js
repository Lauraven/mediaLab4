/*
 *  Copyright (c) 2015 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */

'use strict';

const snapshotButton = document.querySelector('button#snapshot');
const filterSelect = document.querySelector('select#filter');

// Put variables in global scope to make them available to the browser console.
const video = window.video = document.querySelector('video');
const liveCanvas = window.liveCanvas = document.querySelector('#liveCanvas');
const canvas = window.canvas = document.querySelector('canvas#output');
canvas.width = 480;
canvas.height = 360;
liveCanvas.width = 480;
liveCanvas.height = 360;

// Global flag for Canny processing
window.cannyEnabled = false;
window.edgeThreshold = 50;

snapshotButton.onclick = function() {
  const ctx = canvas.getContext('2d');
  
  if (filterSelect.value === 'canny') {
    // For Canny, copy from live canvas and NO CSS class
    canvas.className = 'none';
    ctx.drawImage(liveCanvas, 0, 0);
  } else {
    // For CSS filters, draw from video and apply CSS class
    canvas.className = filterSelect.value;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  }
};

filterSelect.onchange = function() {
  const selectedFilter = filterSelect.value;
  
  if (selectedFilter === 'canny') {
    // Show live canvas for Canny, hide video
    window.cannyEnabled = true;
    video.style.display = 'none';
    liveCanvas.style.display = 'block';
  } else {
    // Show video with CSS filter, hide live canvas
    window.cannyEnabled = false;
    video.style.display = 'block';
    liveCanvas.style.display = 'none';
    video.className = selectedFilter;
  }
};

const constraints = {
  audio: false,
  video: true
};

function handleSuccess(stream) {
  window.stream = stream; // make stream available to browser console
  video.srcObject = stream;
}

function handleError(error) {
  console.log('navigator.MediaDevices.getUserMedia error: ', error.message, error.name);
}

navigator.mediaDevices.getUserMedia(constraints).then(handleSuccess).catch(handleError);