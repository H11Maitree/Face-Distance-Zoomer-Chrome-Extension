// camera.js

'use strict';

function WPCamera(element) {
  this.initialize(element);
}

WPCamera.prototype.initialize = function (element, settings) {
  this.frame = element;
  this.settings = settings || { position: 'leftBottom', mirror: true, trackPresentation: true, width: 240 };
  this.video = this.getDocument().createElement('video');
  this.videoStream = null;
  this.isRunning = false;
  this.isWaitingStream = false;
  this.fullscreenElementAttached = null;

  this.container = this.getDocument().createElement('div');
  this.wrapper = this.getDocument().createElement('div');
  this.container.id = "video-container"

  this.wrapper.appendChild(this.container);
  this.wrapper.style.zIndex = "99";
  this.wrapper.style.gridArea = "1/1";

  this.container.appendChild(this.video);
  element.appendChild(this.wrapper);
};

WPCamera.prototype.setFlip = function () {
  var containerStyle = this.container.style;
  var transform = this.settings.mirror ? 'scaleX(-1)' : '';
  var flip = this.settings.mirror ? 'FlipH' : '';

  containerStyle.webkitTransform = transform;
  containerStyle.mozTransform = transform;
  containerStyle.msTransform = transform;
  containerStyle.oTransform = transform;
  containerStyle.transform = transform;
  containerStyle.filter = flip;
  containerStyle.msFilter = flip;
};

WPCamera.prototype.setShape = function () {
  var video = this.video;
  var container = this.container;

  video.style.marginLeft = '0px';
  video.style.marginRight = '0';
  video.style.marginTop = '0';
  video.style.marginBottom = '0';
  container.style.overflow = 'hidden';
  container.style.borderRadius = '0';

  // Wait for video metadata to get the actual video dimensions
  video.addEventListener('loadedmetadata', (e) => {
    var inputRatioWidthHeight = video.videoWidth / video.videoHeight;
    var width = this.settings.width || 240;
    var height = width / inputRatioWidthHeight;
    video.style.width = width + 'px';
    video.style.height = height + 'px';
    container.style.width = width + 'px';
    container.style.height = height + 'px';
    console.log(width);
    console.log(height)
  });
};

WPCamera.prototype.setPosition = function () {
  var settings = this.settings;
  var frame = this.frame;
  var paddingH = '10px';
  var paddingV = '20px';

  switch (settings.position) {
    case 'leftTop':
      frame.style.left = paddingH;
      frame.style.bottom = '';
      frame.style.right = '';
      frame.style.top = paddingV;
      break;
    case 'rightTop':
      frame.style.left = '';
      frame.style.bottom = '';
      frame.style.right = paddingH;
      frame.style.top = paddingV;
      break;
    case 'rightBottom':
      frame.style.left = '';
      frame.style.bottom = paddingV;
      frame.style.right = paddingH;
      frame.style.top = '';
      break;
    default:
      frame.style.left = paddingH;
      frame.style.bottom = paddingV;
      frame.style.right = '';
      frame.style.top = '';
  }
};

WPCamera.prototype.getDocument = function () {
  return window.document;
};

WPCamera.prototype.updateSettings = function (newSettings) {
  if (newSettings) {
    this.settings = newSettings;
  }

  this.setFlip();
  this.setShape();
  this.setPosition();
};

WPCamera.prototype.watchPunch = function () {
  var _this = this;

  if (!_this.settings.trackPresentation) {
    return;
  }

  _this.observer = new MutationObserver(function () {
    var fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement;
    _this.switchFrameParent(fullscreenElement);
  });

  _this.observer.observe(document.body, { childList: true });
};

WPCamera.prototype.switchFrameParent = function (newParent) {
  if (newParent && newParent != this.fullscreenElementAttached) {
    this.video.pause();

    this.frame.parentElement.removeChild(this.frame);
    newParent.appendChild(this.frame);
    this.fullscreenElementAttached = newParent;

    this.video.play();
  }

  if (!newParent && this.fullscreenElementAttached) {
    this.video.pause();

    this.frame.parentElement.removeChild(this.frame);
    document.body.appendChild(this.frame);
    this.fullscreenElementAttached = null;

    this.video.play();
  }
};

WPCamera.prototype.stopWatchingPunch = function () {
  if (this.observer) {
    this.observer.disconnect();
  }

  this.switchFrameParent(null);
};

WPCamera.prototype.handleError = function (e) {
  if (e.name === 'PermissionDeniedError') {
    alert('Sorry, only HTTPS:// are allowed!');
  } else {
    console.log(e);
  }

  this.isWaitingStream = false;
};

WPCamera.prototype.handleVideo = function (stream) {
  var _this = this;

  this.video.onloadedmetadata = function () {
    _this.video.play();
    _this.isRunning = true;
    _this.isWaitingStream = false;
    _this.watchPunch();
  };

  this.video.onloadeddata = function () {
    setupFacemesh(_this.video, _this.settings)
  }

  this.videoStream = stream;
  this.video.srcObject = stream;

};

WPCamera.prototype.startStream = function () {
  if (this.isRunning || this.isWaitingStream) {
    return;
  }

  var _this = this;
  this.isWaitingStream = true;

  navigator.getUserMedia = navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia ||
    navigator.msGetUserMedia ||
    navigator.oGetUserMedia;

  if (navigator.getUserMedia) {
    try {
      navigator.getUserMedia({ video: true }, function (s) {
        _this.handleVideo(s);
      }, function (e) {
        _this.handleError(e);
      });
    } catch (e) {
      this.handleError(e);
    }
  }
};

WPCamera.prototype.stopStream = function () {
  if (!this.isRunning || this.isWaitingStream) {
    return;
  }

  this.video.pause();

  if (this.videoStream) {
    if (this.videoStream.getTracks) {
      var track = this.videoStream.getTracks()[0];
      track.stop();
    }
    else if (this.videoStream.stop) {
      this.videoStream.stop();
    }
  }
  this.videoStream = null;
  this.video.srcObject = null;
  this.isRunning = false;
  this.stopWatchingPunch();
};