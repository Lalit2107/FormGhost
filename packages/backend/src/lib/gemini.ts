import { GoogleGenerativeAI } from '@google/generative-ai';
import { DetectedField, AutofillResult } from '@formghost/shared';

// Pre-defined heuristic mappings
const HEURISTIC_MAP: Record<string, string> = {
  fname: 'first_name',
  first_name: 'first_name',
  'given-name': 'first_name',
  lname: 'last_name',
  last_name: 'last_name',
  'family-name': 'last_name',
  email: 'email',
  phone: 'phone',
  tel: 'phone',
  city: 'city',
  zip: 'zip_code',
  postal: 'zip_code',
};

function localHeuristicMatch(
  profileData: Record<string, any>,
  fields: DetectedField[]
): { results: AutofillResult[], remainingFields: DetectedField[] } {
  const results: AutofillResult[] = [];
  const remainingFields: DetectedField[] = [];

  fields.forEach(field => {
    // Check autocomplete first, then name
    const hint = (field.autocomplete || field.name || '').toLowerCase();
    const mappedKey = HEURISTIC_MAP[hint] || Object.keys(HEURISTIC_MAP).find(k => hint.includes(k)) && HEURISTIC_MAP[Object.keys(HEURISTIC_MAP).find(k => hint.includes(k))!];
    
    if (mappedKey && profileData[mappedKey]) {
      results.push({
        selector: field.selector,
        value: profileData[mappedKey],
        confidence: 1, // 100% confidence for heuristic match
        fieldCategory: mappedKey
      });
    } else {
      remainingFields.push(field);
    }
  });

  return { results, remainingFields };
}

export function getGeminiClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('Missing GEMINI_API_KEY environment variable');
  }
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

export async function classifyFieldsWithAI(
  profileData: Record<string, any>, 
  fields: DetectedField[]
): Promise<AutofillResult[]> {
  
  // 1. Try heuristics first to save API calls
  const { results: heuristicResults, remainingFields } = localHeuristicMatch(profileData, fields);

  if (remainingFields.length === 0) {
    return heuristicResults;
  }

  // 2. Call Gemini for the remaining ambiguous fields
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `System: You are FormGhost, an intelligent form field classifier.
Given a user's profile data and a list of detected form fields, determine which profile value should fill each field.

Rules:
1. Match fields based on label, name, placeholder, and surrounding context.
2. If unsure about a field, set confidence < 0.5 and leave value empty.
3. Never fabricate data that isn't in the user profile.

Profile Data:
${JSON.stringify(profileData, null, 2)}

Detected Fields:
${JSON.stringify(fields, null, 2)}

Return ONLY a JSON array of objects with keys: selector, value, confidence, fieldCategory.
Do not wrap the output in markdown code blocks like \`\`\`json. Return bare JSON.`;

  try {
    const result = await model.generateContent(prompt);
    const textResult = result.response.text();
    // Clean up potential markdown formatting if the model still adds it
    const cleanedText = textResult.replace(/```json/g, '').replace(/```/g, '').trim();
    const aiResults = JSON.parse(cleanedText) as AutofillResult[];
    
    return [...heuristicResults, ...aiResults];
  } catch (err) {
    console.error('Gemini Classification Error:', err);
    // On AI failure, return at least the heuristic matches
    return heuristicResults;
  }
}
