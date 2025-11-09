
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

type Row = {
  id: string; name: string; city: string; address: string|null;
  open_now: boolean|null; deals: { beer:string; style:string; price:number; rating:number; updatedAt:string|null }[]|null
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const city = searchParams.get('city');
  const sort = searchParams.get('sort'); // 'cheapest' | 'standard'

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  // Materialize deals per venue via SQL (JSON agg)
  const sql = `
    with r as (
      select v.id, v.name, v.city, v.address, v.open_now,
        json_agg(
          json_build_object(
            'beer', b.name, 'style', b.style,
            'price', p.price_sek, 'rating', coalesce(p.rating,0),
            'updatedAt', p.created_at
          )
          order by p.price_sek asc
        ) as deals
      from venues v
      left join prices p on p.venue_id = v.id
      left join beers b on b.id = p.beer_id
      ${city ? 'where v.city = :city' : ''}
      group by v.id
    )
    select * from r
  `;

  const { data, error } = await supabase.rpc('exec_sql', { sql, params: { city } } as any)
    .select<Row>();

  // Fallback if rpc/exec_sql is not enabled: do it in 2 queries
  let rows: Row[] = [];
  if (error) {
    const vq = supabase.from('venues').select('id,name,city,address,open_now' + (city ? '').toString()).eq('city', city || '');
    const vres = city ? await vq.eq('city', city) : await vq;
    if (vres.error) return NextResponse.json({ error: vres.error.message }, { status: 500 });
    const venues = vres.data ?? [];
    const pres = await supabase.from('prices').select('venue_id, price_sek, rating, created_at, beer_id');
    const bres = await supabase.from('beers').select('id,name,style');
    const beersById = new Map((bres.data||[]).map((b:any)=>[b.id,b]));

    rows = venues.map((v:any)=>{
      const deals = (pres.data||[]).filter((p:any)=>p.venue_id===v.id).map((p:any)=>{
        const b = beersById.get(p.beer_id) || { name:'', style:'' };
        return { beer:b.name, style:b.style, price:p.price_sek, rating:p.rating||0, updatedAt:p.created_at };
      }).sort((a:any,b:any)=>a.price-b.price);
      return { ...v, deals };
    });
  } else {
    rows = (data||[]) as any;
  }

  // Sorting
  if (sort === 'cheapest') {
    rows.sort((a:any,b:any)=>{
      const ap = a.deals?.length ? Math.min(...a.deals.map((d:any)=>d.price)) : Number.POSITIVE_INFINITY;
      const bp = b.deals?.length ? Math.min(...b.deals.map((d:any)=>d.price)) : Number.POSITIVE_INFINITY;
      return ap - bp;
    });
  } else {
    rows.sort((a:any,b:any)=> (b.open_now?1:0) - (a.open_now?1:0));
  }

  return NextResponse.json(rows);
}
