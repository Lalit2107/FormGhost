import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';
import { classifyFieldsWithAI } from '@/lib/gemini';
import { stripSensitivePII } from '@/lib/piiStripper';
import { z } from 'zod';

const autofillRequestSchema = z.object({
  fields: z.array(z.any()), // Array of DetectedField
  decryptedProfileData: z.record(z.any()), // Client decrypts and sends over TLS
  domain: z.string().min(1)
});

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  try {
    const jsonBody = await request.json();
    const parsed = autofillRequestSchema.safeParse(jsonBody);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload schema', details: parsed.error }, { status: 400 });
    }

    const { fields, decryptedProfileData, domain } = parsed.data;

    // 1. Authenticate user
    const supabase = getSupabaseClient(authHeader);
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Strip sensitive PII and Classify fields with Gemini
    const sanitizedProfile = stripSensitivePII(decryptedProfileData);
    const results = await classifyFieldsWithAI(sanitizedProfile, fields);

    // 3. Log a fill session for rate limiting / basic analytics (in background, don't await)
    const fieldsFilled = results.filter(r => r.value && r.confidence > 0.5).length;
    supabase.from('fill_sessions').insert({
      user_id: user.id,
      fields_count: fields.length,
      fields_filled: fieldsFilled,
      domain: domain
    }).then(); // Fire and forget

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error('Autofill API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
