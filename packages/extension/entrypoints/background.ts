export default defineBackground(() => {
  console.log('FormGhost background script loaded');

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

    // ── 1. Popup asks to SCAN the current tab ──
    if (message.type === 'REQUEST_SCAN') {
      chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
        const tabId = tabs[0]?.id;
        if (!tabId) {
          sendResponse({ type: 'FORM_DETECTED', fields: [] });
          return;
        }

        try {
          // Try sending to content script directly
          const response = await chrome.tabs.sendMessage(tabId, { type: 'SCAN_FORM' });
          sendResponse(response);
        } catch (err) {
          // Content script not injected yet — inject it first, then retry
          try {
            await chrome.scripting.executeScript({
              target: { tabId },
              files: ['content-scripts/content.js'],
            });
            // Small delay for script to initialise
            await new Promise(r => setTimeout(r, 300));
            const response = await chrome.tabs.sendMessage(tabId, { type: 'SCAN_FORM' });
            sendResponse(response);
          } catch (innerErr) {
            console.error('Content script injection failed:', innerErr);
            sendResponse({ type: 'FORM_DETECTED', fields: [] });
          }
        }
      });
      return true; // keep channel open for async
    }

    // ── 2. Popup sends AUTOFILL results to inject into the page ──
    if (message.type === 'AUTOFILL_RESULT') {
      chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
        const tabId = tabs[0]?.id;
        if (!tabId) return;

        try {
          await chrome.tabs.sendMessage(tabId, {
            type: 'AUTOFILL_RESULT',
            results: message.results,
          });
          sendResponse({ success: true });
        } catch (err) {
          console.error('Failed to send autofill to tab:', err);
          sendResponse({ success: false });
        }
      });
      return true;
    }
  });
});
