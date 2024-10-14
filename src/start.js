// start.js

function enchantHtml() {
  var frame = document.getElementById('wp_frame');
  if (!frame) {
    frame = document.createElement('div');
    frame.id = 'wp_frame';
    frame.className = 'wp-main-frame';
    document.body.appendChild(frame);
    frame.menu = new WPRightMenu(frame);
  }
  return frame;
}

function getSettings(callback) {
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

  chrome.storage.sync.get({
    position: 'leftBottom',
    mirror: true,
    trackPresentation: true,
    zoomBreakpoints: defaultZoomBreakpoints
  }, function (items) {
    callback(items);
  });
}

(function start() {
  getSettings(function (settings) {
    var frame = enchantHtml();

    if (!frame.camera) {
      frame.camera = new WPCamera(frame, settings);
    }

    if (frame.menu) {
      frame.menu.hide();

      frame.menu.onMenuClick = function (key, newValue) {
        if (key !== 'visibility') {
          settings[key] = newValue;
          frame.camera.updateSettings(settings);

          try {
            chrome.storage.sync.set(settings);
          }
          catch (e) {
            console.log('sync set fail: ', e);
          }

        }
      };
    }

    frame.camera.updateSettings(settings);
    frame.camera.startStream();
  });
})();
