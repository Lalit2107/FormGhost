import { AutofillResult } from '@formghost/shared';

/**
 * Injects values into form fields based on AI classification results.
 */
export function fillFormFields(results: AutofillResult[]): void {
  results.forEach((result) => {
    const element = document.querySelector(result.selector) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    
    if (!element || !result.value) return;

    // React-compatible input setting
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value'
    )?.set;
    
    const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      'value'
    )?.set;

    const nativeSelectValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLSelectElement.prototype,
      'value'
    )?.set;

    if (element instanceof HTMLInputElement && nativeInputValueSetter) {
      nativeInputValueSetter.call(element, result.value);
    } else if (element instanceof HTMLTextAreaElement && nativeTextAreaValueSetter) {
      nativeTextAreaValueSetter.call(element, result.value);
    } else if (element instanceof HTMLSelectElement && nativeSelectValueSetter) {
      nativeSelectValueSetter.call(element, result.value);
    } else {
      element.value = result.value;
    }

    // Dispatch events to trigger framework updates (React, Vue, etc.)
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    element.dispatchEvent(new Event('blur', { bubbles: true }));
  });
}
