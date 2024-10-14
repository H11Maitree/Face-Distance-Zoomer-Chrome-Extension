// zooming.js

function getFirstOrNull(l){
    if(l.length==0)
        return null;
    return l[0]
}

let queue_buffer = [];
function relay(zoomState) {
    const currentTime = Date.now();

    // Add the new zoomState with a timestamp
    queue_buffer.push({ state: zoomState, time: currentTime });

    const timeLimit = 1200; // 1.2 seconds in milliseconds for delay before perform zooming.
    
    // Remove states that are older than 3 seconds
    queue_buffer = queue_buffer.filter(item => currentTime - item.time <= timeLimit);

    // Check if all zoomStates in the buffer are the same
    // console.log(queue_buffer);
    if (queue_buffer.length > 10 && queue_buffer.every(item => item.state === queue_buffer[0].state))
        action(queue_buffer[0].state); // Replace with your actual action

}

function action(zoomState) {
    // Adjust the zooming
    console.log(`Perform Zoom: ${zoomState}`);
    document.firstElementChild.style.zoom = zoomState;
}

function getZoomStateFromBoundingBox(boundingBox, settings){
    const bottomRight = boundingBox.bottomRight[0];
    const topLeft = boundingBox.topLeft[0];

    const height = bottomRight[1] - topLeft[1];
    const width = bottomRight[0] - topLeft[0];

    console.log(`Face width: ${width}`);

    function getZoomState(faceWidth) {
        let zoomLevel = undefined;
        settings.zoomBreakpoints.forEach(breakpoint => {
          if (faceWidth >= breakpoint.faceWidth) {
            zoomLevel = breakpoint.zoom;
          }
        });
        return zoomLevel;
    }

    relay(getZoomState(width));
}

function performZooming(predictions, settings){
    const prediction = getFirstOrNull(predictions);

    console.log(settings)
    
    if(prediction !== null){
        getZoomStateFromBoundingBox(prediction.boundingBox, settings);
    }

}