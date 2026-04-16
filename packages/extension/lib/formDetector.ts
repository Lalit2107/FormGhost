import { DetectedField } from '@formghost/shared';

/**
 * Utility to find all form fields on the current page and extract metadata.
 */
export function scanFormFields(): DetectedField[] {
  const fields: DetectedField[] = [];
  const fieldElements = document.querySelectorAll(
    'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]), select, textarea'
  );

  fieldElements.forEach((el) => {
    const element = el as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    
    // Skip if not visible
    if (element.offsetWidth === 0 || element.offsetHeight === 0) return;

    const label = findLabelForElement(element);
    const surroundingText = getSurroundingText(element);

    fields.push({
      selector: getUniqueSelector(element),
      tagName: element.tagName.toLowerCase(),
      inputType: (element as HTMLInputElement).type || '',
      name: element.name || undefined,
      id: element.id || undefined,
      label: label || undefined,
      placeholder: element.placeholder || undefined,
      ariaLabel: element.getAttribute('aria-label') || undefined,
      autocomplete: element.autocomplete || undefined,
      surroundingText: surroundingText || undefined,
      required: element.required || false,
      currentValue: element.value || undefined,
    });
  });

  return fields;
}

/**
 * Finds the text content of the label associated with the element.
 */
function findLabelForElement(element: HTMLElement): string | null {
  // 1. Check for <label for="id">
  if (element.id) {
    const label = document.querySelector(`label[for="${element.id}"]`);
    if (label && label.textContent) return label.textContent.trim();
  }

  // 2. Check for parent <label>
  const parentLabel = element.closest('label');
  if (parentLabel && parentLabel.textContent) {
    // Exclude the element's own text if it's nested (e.g., <label>Name: <input /></label>)
    return parentLabel.innerText.replace(element.innerText, '').trim();
  }

  // 3. Check for aria-labelledby
  const labelledBy = element.getAttribute('aria-labelledby');
  if (labelledBy) {
    const labelElement = document.getElementById(labelledBy);
    if (labelElement && labelElement.textContent) return labelElement.textContent.trim();
  }

  return null;
}

/**
 * Gets a snippet of text around the element for additional context.
 */
function getSurroundingText(element: HTMLElement): string | null {
  const parent = element.parentElement;
  if (!parent) return null;

  // Get text from the parent, excluding the element itself
  const text = parent.innerText || '';
  const cleanText = text.replace(/\s+/g, ' ').trim();
  
  // Return a slice around the element
  return cleanText.substring(0, 100); 
}

/**
 * Generates a CSS selector that uniquely identifies the element.
 */
function getUniqueSelector(element: HTMLElement): string {
  if (element.id) return `#${CSS.escape(element.id)}`;
  
  if (element.name) {
    const nameSelector = `${element.tagName.toLowerCase()}[name="${CSS.escape(element.name)}"]`;
    if (document.querySelectorAll(nameSelector).length === 1) return nameSelector;
  }

  // Fallback to path-based selector (simplified)
  let selector = element.tagName.toLowerCase();
  let parent = element.parentElement;
  while (parent && parent !== document.body) {
    const index = Array.from(parent.children).indexOf(element) + 1;
    selector = `${parent.tagName.toLowerCase()} > ${selector}:nth-child(${index})`;
    break; // Keep it shallow for now
  }
  
  return selector;
}
