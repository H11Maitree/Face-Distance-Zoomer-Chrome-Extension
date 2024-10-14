// background.js

let activeTabId = null;

async function startWP(tabId) {
  try {
    await chrome.scripting.insertCSS({
      target: { tabId: tabId },
      files: ["res/wp-style.css"]
    });

    const scripts = [
      "libs/ml5.min.js",
      "src/faceMesh.js",
      "src/zooming.js",
      "src/camera.js",
      "src/rightMenu.js",
      "src/start.js"
    ];

    for (const script of scripts) {
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: [script]
      });
    }
  } catch (error) {
    console.error('Error injecting scripts:', error);
  }
}

async function terminateWP(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ["src/terminate.js"]
    });
  } catch (error) {
    console.error('Error terminating script:', error);
  }
}

chrome.action.onClicked.addListener(async (tab) => {
  if (activeTabId) {
    await terminateWP(activeTabId);
    activeTabId = null;
    chrome.action.setBadgeText({ text: "" });
  } else {
    activeTabId = tab.id;
    await startWP(activeTabId);
    chrome.action.setBadgeText({ text: " " });
    chrome.action.setBadgeBackgroundColor({ color: "#34c759" });
  }
});

async function updateTab(tabId) {
  if (activeTabId) {
    await terminateWP(activeTabId);
    activeTabId = tabId;
    await startWP(tabId);
  }
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo && changeInfo.status === 'complete') {
    updateTab(tabId);
  }
});

chrome.tabs.onActivated.addListener((activeInfo) => {
  const tabId = activeInfo.tabId;
  updateTab(tabId);
});