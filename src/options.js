// options.js

'use strict';

let settings = { position: undefined, mirror: undefined, trackPresentation: undefined, zoomBreakpoints: undefined };

const defaultZoomBreakpoints = [
  {
    faceWidth: 0,
    zoom: '100%'
  },
  {
    faceWidth: 120,
    zoom: '125%'
  }, 
  {
    faceWidth: 150,
    zoom: '150%'
  }, 
  {
    faceWidth: 200,
    zoom: '175%'
  },
];

function enforceOptions() {
  document.getElementById('position').value = settings.position;
  document.getElementById('mirror').checked = settings.mirror;
  document.getElementById('trackPresentation').checked = settings.trackPresentation;
  document.getElementById('zoomBreakpoints').value = JSON.stringify(settings.zoomBreakpoints);

  let canvas = document.getElementById('facemesh-canvas');
  let video = document.getElementById("vid");
  var transform = settings.mirror ? 'scaleX(-1)' : '';
  var flip = settings.mirror ? 'FlipH' : '';
  canvas.style.webkitTransform = transform;
  canvas.style.mozTransform = transform;
  canvas.style.msTransform = transform;
  canvas.style.oTransform = transform;
  canvas.style.transform = transform;
  canvas.style.filter = flip;
  canvas.style.msFilter = flip;
  video.style.webkitTransform = transform;
  video.style.mozTransform = transform;
  video.style.msTransform = transform;
  video.style.oTransform = transform;
  video.style.transform = transform;
  video.style.filter = flip;
  video.style.msFilter = flip;
}

function saveOptions() {
  var position = document.getElementById('position').value;
  var mirror = document.getElementById('mirror').checked;
  var trackPresentation = document.getElementById('trackPresentation').checked;
  var zoomBreakpoints = settings.zoomBreakpoints;
  try {
    zoomBreakpoints = JSON.parse(document.getElementById('zoomBreakpoints').value);
  } catch (error) {
    console.error("Failed to parse zoom breakpoints:", error);
    return;
  }

  chrome.storage.sync.set({
    position: position,
    mirror: mirror,
    trackPresentation: trackPresentation,
    zoomBreakpoints: zoomBreakpoints
  }, function () {
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(function () {
      status.textContent = '';
    }, 750);
  });

  restoreOptions();
}

function restoreOptions() {
  // Use default value color = 'red' and likesColor = true.
  chrome.storage.sync.get({
    position: 'leftBottom',
    mirror: true,
    trackPresentation: true,
    zoomBreakpoints: defaultZoomBreakpoints,
  }, function (items) {
    settings = items;
    enforceOptions();
  });
}

let predictions = [];
function getFirstOrNull(l) {
  if (l.length == 0)
    return null;
  return l[0]
}

function getWidthFromBoundingBox(boundingBox) {
  const bottomRight = boundingBox.bottomRight[0];
  const topLeft = boundingBox.topLeft[0];

  const height = bottomRight[1] - topLeft[1];
  const width = bottomRight[0] - topLeft[0];

  return width;
}

function updateParameters() {
  function getZoomState(faceWidth) {
    let zoomLevel = undefined;
    settings.zoomBreakpoints.forEach(breakpoint => {
      if (faceWidth >= breakpoint.faceWidth) {
        zoomLevel = breakpoint.zoom;
      }
    });
    return zoomLevel;
  }
  const prediction = getFirstOrNull(predictions);
  let zoomState = document.getElementById("zoom-state-label");
  let faceWidth = document.getElementById("face-width-label");

  if (prediction === null) {
    zoomState.textContent = "N/A";
    faceWidth.textContent = "N/A";
  } else {
    let width = getWidthFromBoundingBox(prediction.boundingBox);
    zoomState.textContent = getZoomState(width);
    faceWidth.textContent = `${Math.round(width)}`;
  }
}

function initCamera() {
  let video = document.getElementById("vid");
  let mediaDevices = navigator.mediaDevices;

  vid.muted = true;
  // Accessing the user camera and video.
  mediaDevices
    .getUserMedia({
      video: true,
      audio: true,
    })
    .then((stream) => {
      // Changing the source of video to current stream.
      video.srcObject = stream;
      video.addEventListener("loadedmetadata", () => {
        video.play();
      });
    })
}

function setupFacemeshDemo() {
  let video = document.getElementById("vid");
  const options = { maxFaces: 1, flipHorizontal: false }
  const facemesh = ml5.facemesh(video, options, () => { console.log('Model Loaded!'); });

  function drawMesh() {
    var vid = document.getElementById('vid');

    const width = vid.offsetWidth;
    const height = vid.offsetHeight;

    const raw_width = video.videoWidth;
    const raw_height = video.videoHeight;

    // Create a canvas dynamically and attach it to the body if it doesn't already exist
    let canvas = document.getElementById('facemesh-canvas');

    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Draw each point of the face mesh
    context.strokeStyle = '#00FF00';
    context.lineWidth = 1;

    for (let i = 0; i < predictions.length; i++) {
      const keypoints = predictions[i].scaledMesh;

      for (let j = 0; j < keypoints.length; j++) {
        const [x, y] = keypoints[j];
        context.beginPath();
        context.arc(x * width / raw_width, y * height / raw_height, 1, 0, 1 * Math.PI);
        context.fillStyle = '#00FF00';
        context.fill();
      }
    }
  }

  facemesh.on('face', results => {
    function filterHighConfident(prediction) {
      if (prediction.faceInViewConfidence < 0.5) {
        return false;
      }
      return true;
    }
    predictions = results.filter(filterHighConfident);
    requestAnimationFrame(() => drawMesh());
    updateParameters();
  });

}

function DOMContentLoaded() {
  restoreOptions();
  initCamera();
  setupFacemeshDemo();
}

document.addEventListener('DOMContentLoaded', DOMContentLoaded);
document.getElementById('save').addEventListener('click', saveOptions);

