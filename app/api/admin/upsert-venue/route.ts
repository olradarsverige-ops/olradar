
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export async function POST(req: Request) {
  const body = await req.json();
  const { name, city, lat, lng } = body || {};
  if (!name || !city || typeof lat !== 'number' || typeof lng !== 'number') {
    return NextResponse.json({ ok:false, error:'missing fields' }, { status: 400 });
  }
  const id = name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  const { error } = await supabase
    .from('venues')
    .upsert({ id, name, city, lat, lng, open_now: true }, { onConflict: 'id' });

  if (error) return NextResponse.json({ ok:false, error: error.message }, { status: 200 });
  return NextResponse.json({ ok:true }, { status: 200 });
}
