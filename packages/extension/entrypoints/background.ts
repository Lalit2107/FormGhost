export default defineBackground(() => {
  console.log('FormGhost background script loaded');

  // Handle messages from Popup or Content Script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // 1. If message is from popup to scan current tab
    if (message.type === 'REQUEST_SCAN') {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, { type: 'SCAN_FORM' }, (response) => {
            sendResponse(response);
          });
        }
      });
      return true; // Keep open for async
    }

    // 2. Add more background orchestration here (e.g., API calls to Gemini/Next.js)
  });
});
