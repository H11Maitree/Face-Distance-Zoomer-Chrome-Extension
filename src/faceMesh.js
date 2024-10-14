// facemesh.js
let video;
let faceMesh;
let predictions = [];

function filterHighConfident(prediction){
    if(prediction.faceInViewConfidence<0.5){
        return false;
    }
    return true;
}

// Initialize face mesh model
function setupFacemesh(aVideo, settings) {
    video = aVideo;
    const options = {maxFaces: 1, flipHorizontal: false}
    const facemesh = ml5.facemesh(video, options ,modelLoaded);
    facemesh.on('face', results => {
        predictions = results.filter(filterHighConfident);
        requestAnimationFrame(() => drawMesh(settings));
        performZooming(predictions, settings);
    });
}

function modelLoaded() {
    console.log('Model Loaded!');
}

// Draw the face mesh results
function drawMesh(settings) {

    var frame = document.getElementById('wp_frame');
    var container = document.getElementById('video-container');

    const width = container.offsetWidth;
    const height = container.offsetHeight;

    const raw_width = video.videoWidth;
    const raw_height = video.videoHeight;

    // Create a canvas dynamically and attach it to the body if it doesn't already exist
    let canvas = document.getElementById('facemesh-canvas');
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'facemesh-canvas';
        canvas.style.zIndex = "100";
        canvas.style.gridArea = "1/1";

        var transform = settings.mirror ? 'scaleX(-1)' : '';
        var flip = settings.mirror ? 'FlipH' : '';

        canvas.style.webkitTransform = transform;
        canvas.style.mozTransform = transform;
        canvas.style.msTransform = transform;
        canvas.style.oTransform = transform;
        canvas.style.transform = transform;
        canvas.style.filter = flip;
        canvas.style.msFilter = flip;

        frame.appendChild(canvas);
    }
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
            context.arc(x*width/raw_width, y*height/raw_height, 1, 0, 1 * Math.PI);
            context.fillStyle = '#00FF00';
            context.fill();
        }
    }
}