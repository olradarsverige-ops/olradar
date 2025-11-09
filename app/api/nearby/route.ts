
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const city = searchParams.get('city') || 'Helsingborg';

  // 1) get venues in city
  const { data: venues, error: vErr } = await supabase
    .from('venues')
    .select('id,name,city,lat,lng,open_now')
    .eq('city', city)
    .limit(200);
  if (vErr || !venues) return NextResponse.json([], { status: 200 });

  const venueIds = venues.map(v => v.id);
  if (venueIds.length === 0) return NextResponse.json([], { status: 200 });

  // 2) get latest prices for those venues (join beers)
  const { data: prices, error: pErr } = await supabase
    .from('prices')
    .select('venue_id, price_sek, rating, verified, photo_url, created_at, beers(name,style)')
    .in('venue_id', venueIds)
    .order('created_at', { ascending: false })
    .limit(1000);
  if (pErr || !prices) {
    return NextResponse.json(venues.map(v => ({ id:v.id, name:v.name, city:v.city, lat:v.lat, lng:v.lng, openNow:v.open_now, deals: [] })), { status: 200 });
  }

  // 3) group per venue, take top 3
  const grouped: Record<string, any[]> = {};
  for (const row of prices) {
    const key = row.venue_id as string;
    if (!grouped[key]) grouped[key] = [];
    if (grouped[key].length < 3 && row.beers) {
      grouped[key].push({
        beer: row.beers.name,
        style: row.beers.style,
        price: row.price_sek,
        rating: row.rating ?? 0,
        verified: row.verified ?? false,
        photoUrl: row.photo_url ?? null,
        updatedAt: row.created_at,
      });
    }
  }

  const resp = venues.map(v => ({
    id: v.id,
    name: v.name,
    city: v.city,
    lat: v.lat,
    lng: v.lng,
    openNow: v.open_now ?? true,
    deals: grouped[v.id] ?? []
  }));

  return NextResponse.json(resp);
}
