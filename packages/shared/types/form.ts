export interface DetectedField {
  selector: string;           // CSS selector to target the element
  tagName: string;            // input, select, textarea
  inputType: string;          // text, email, tel, etc.
  name?: string;              // name attribute
  id?: string;                // id attribute
  label?: string;             // Associated <label> text
  placeholder?: string;       // Placeholder text
  ariaLabel?: string;         // aria-label
  autocomplete?: string;      // autocomplete attribute hint
  surroundingText?: string;   // Nearby text context (50 chars)
  required: boolean;
  currentValue?: string;
}

export interface AutofillResult {
  selector: string;
  value: string;
  confidence: number;         // 0-1 AI confidence score
  fieldCategory: string;      // "first_name", "email", etc.
}
