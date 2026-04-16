import { DetectedField, AutofillResult } from './form';

export type MessageType =
  | { type: 'SCAN_FORM'; }
  | { type: 'FORM_DETECTED'; fields: DetectedField[] }
  | { type: 'REQUEST_AUTOFILL'; fields: DetectedField[]; profileId: string }
  | { type: 'AUTOFILL_RESULT'; results: AutofillResult[] }
  | { type: 'AUTOFILL_ERROR'; error: string }
  | { type: 'AUTH_STATUS'; isAuthenticated: boolean; userId?: string };
