// options.js

'use strict';

let settings = { 
  position: undefined, 
  mirror: undefined, 
  trackPresentation: undefined, 
  zoomBreakpoints: undefined 
};

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
  // var position = document.getElementById('position').value;
  // var mirror = document.getElementById('mirror').checked;
  // var trackPresentation = document.getElementById('trackPresentation').checked;
  // var zoomBreakpoints = settings.zoomBreakpoints;
  // try {
  //   zoomBreakpoints = JSON.parse(document.getElementById('zoomBreakpoints').value);
  // } catch (error) {
  //   console.error("Failed to parse zoom breakpoints:", error);
  //   return;
  // }

  // chrome.storage.sync.set({
  //   position: position,
  //   mirror: mirror,
  //   trackPresentation: trackPresentation,
  //   zoomBreakpoints: zoomBreakpoints
  // }, function () {
  //   // Update status to let user know options were saved.
  //   var status = document.getElementById('status');
  //   status.textContent = 'Options saved.';
  //   setTimeout(function () {
  //     status.textContent = '';
  //   }, 750);
  // });

  restoreOptions();
}

function restoreOptions() {
  // Use default value color = 'red' and likesColor = true.
  // chrome.storage.sync.get({
  //   position: 'leftBottom',
  //   mirror: true,
  //   trackPresentation: true,
  //   zoomBreakpoints: defaultZoomBreakpoints,
  // }, function (items) {
  //   settings = items;
  //   enforceOptions();
  //   updateValues();
  // });
  updateValues();
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
    settings.zoomBreakpoints?.forEach(breakpoint => {
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


///////////////////////////////////////////////////////////////////////////////////////////////////
// slider
////////////////////////////////////////////////////////////////////////////////////////////


let sliderContainer = document.querySelector(".slider-container");
let sliders = document.querySelectorAll(".slider-pointer");

function updateValues() {
  const values = Array.from(sliders).map((slider) => Number(slider.dataset.value));
  console.log("updateValues")
  
  sliders?.forEach((slider) => {
    slider.remove();
  })
  const min = 50;
  const max = 500;

  settings.zoomBreakpoints?.forEach((breakpoint)=>{
    const newDiv = document.createElement("div");
    newDiv.classList.add("slider-pointer");
    console.log((Number.parseInt(breakpoint.zoomState) - min) / (max-min) * sliderContainer.offsetWidth)
    newDiv.style.left = Math.round((Number.parseInt(breakpoint.zoomState) - min)  / (max-min) * sliderContainer.offsetWidth) + "px" ;
  
    if (sliders.length > 0) {
      sliders.push(newDiv)
    } else {
      sliders = [newDiv];
    }

    sliderContainer.appendChild(newDiv);
  })
}

// TODO: make it a function and change zoom value
sliders.forEach((slider) => {
  slider.addEventListener("mousedown", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const target = e.target;
    const sliderWidth = target.parentNode.offsetWidth;
    const sliderHeight = target.parentNode.offsetHeight;
    const sliderTop = target.parentNode.offsetTop;

    let prevX = e.clientX;
    let prevY = e.clientY;


    function onMouseMove(e) {
      const deltaX = e.clientX - prevX;
      const deltaY = e.clientY;
      const newPosition = Math.min(Math.max(target.offsetLeft + deltaX, 0), sliderWidth);

      if (Math.abs(deltaY - sliderTop) > 50) {
        target.style.top = e.clientY;
      }

      target.style.left = newPosition + "px";
      target.dataset.value = Math.round((newPosition / sliderWidth) * 100);
      updateValues();
    }

    function onMouseUp(e) {
      console.log(e.target.offsetLeft);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    }

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  });
});

// sliderContainer.addEventListener("mousedown", (e) => {
//   const target = e.target;
//   const sliderWidth = target.offsetWidth;

//   const newDiv = document.createElement("div");
//   newDiv.classList.add("slider-pointer");
//   newDiv.style.left = e.clientX + "px";

//   newDiv.addEventListener("mousedown", (e) => {
//     e.preventDefault();
//     e.stopPropagation();
//     const target = e.target;
//     const sliderWidth = target.parentNode.offsetWidth;
//     let prevX = e.clientX;

//     function onMouseMove(e) {
//       const deltaX = e.clientX - prevX;
//       const newPosition = Math.min(Math.max(target.offsetLeft + deltaX, 0), sliderWidth);
//       prevX = e.clientX;

//       target.style.left = newPosition + "px";
//       target.dataset.value = Math.round((newPosition / sliderWidth) * 100);
//       updateValues();
//     }

//     function onMouseUp(e) {
//       console.log(e.target.offsetLeft);
//       document.removeEventListener("mousemove", onMouseMove);
//       document.removeEventListener("mouseup", onMouseUp);
//     }

//     document.addEventListener("mousemove", onMouseMove);
//     document.addEventListener("mouseup", onMouseUp);
//   });

//   sliderContainer.appendChild(newDiv);

// })

// Update the values initially
updateValues();


///////////////////////////////////////////////////////////////////////////////////////////////////
// model
///////////////////////////////////////////////////////////////////////////////////////////////////
let model = document.querySelector(".model-container");

const addBreakpointButton = document.querySelector("#addBreakpointButton");
addBreakpointButton.addEventListener("click", () => {
  console.log("addBreakpointButton");
  model.classList.add("open");
  model.classList.remove("close");
});

const saveBreakpointButton = document.querySelector(".breakpoint-options-save");
saveBreakpointButton.addEventListener("click", () => {
  console.log("saveBreakpointButton");
  // remind before push: change width
  // TODO maybe: add notification when face not detected
  const prediction = getFirstOrNull(predictions);
  const width = Math.round(getWidthFromBoundingBox(prediction.boundingBox));
  const zoom = document.getElementById("zoom-breakpoint").value + "%";
  // const width = 100 + settings?.zoomBreakpoints?.length * 20;

  if (settings.zoomBreakpoints){
    settings.zoomBreakpoints.push({
      faceWidth: width,
      zoomState: zoom,
    })
  }else {
    settings.zoomBreakpoints=[{
      faceWidth: width,
      zoomState: zoom,
    }]
  }
  updateValues()
  model.classList.remove("open");
  model.classList.add("close");
});

const closeModelButton = document.querySelector(".model-close");
closeModelButton.addEventListener("click", () => {
  console.log("closeModelButton");
  model.classList.remove("open");
  model.classList.add("close");
});