
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const city = searchParams.get('city') || 'Helsingborg';
  const { data, error } = await supabase.from('vw_nearby').select('*').eq('city', city).limit(50);
  if (error) return NextResponse.json([], { status: 200 });
  return NextResponse.json(data ?? []);
}
