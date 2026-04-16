import { scanFormFields } from '../lib/formDetector';
import { fillFormFields } from '../lib/formFiller';
import { MessageType } from '@formghost/shared';

export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    console.log('FormGhost content script loaded');

    chrome.runtime.onMessage.addListener((message: MessageType, sender, sendResponse) => {
      switch (message.type) {
        case 'SCAN_FORM':
          const fields = scanFormFields();
          sendResponse({ type: 'FORM_DETECTED', fields });
          break;

        case 'AUTOFILL_RESULT':
          fillFormFields(message.results);
          sendResponse({ type: 'SUCCESS' });
          break;
      }
      return true; // Keep the message channel open for async response
    });
  },
});
