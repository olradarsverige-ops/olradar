
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

function slugify(input: string) {
  return input.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
}

export async function POST(req: Request) {
  const body = await req.json();
  const { city, venueName, beerName, style, price, rating, photoUrl, verified } = body;

  if (!venueName || !beerName || !city) {
    return NextResponse.json({ ok:false, error: 'Missing fields' }, { status: 400 });
  }

  const venueId = slugify(`${venueName}-${city}`);
  await supabase.from('venues').upsert([{ id: venueId, name: venueName, city }], { onConflict: 'id' });

  const beerId = slugify(beerName) + '-' + Math.random().toString(36).slice(2,6);
  await supabase.from('beers').upsert([{ id: beerId, name: beerName, style }], { onConflict: 'name' });

  const { error } = await supabase.from('prices').insert([{
    id: crypto.randomUUID(),
    venue_id: venueId,
    beer_id: beerId,
    price_original: price,
    currency: 'SEK',
    price_sek: price,
    rating,
    user_id: null,
    photo_url: photoUrl,
    ocr_text: null,
    verified: !!verified
  }]);

  if (error) return NextResponse.json({ ok:false, error: error.message }, { status: 400 });
  return NextResponse.json({ ok:true });
}
