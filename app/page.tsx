
'use client';
import { useEffect, useMemo, useState } from 'react';

type Deal = { beer:string; style:string; price:number; rating:number; updatedAt?:string; photoUrl?:string; verified?:boolean };
type Venue = { id:string; name:string; city:string; address?:string|null; lat?:number|null; lng?:number|null; open_now?:boolean; deals?:Deal[] };

const styles = {
  page:{ background:'#121417', minHeight:'100dvh', color:'#eef1f5' as const },
  shell:{ maxWidth:980, margin:'0 auto', padding:'20px 12px' },
  header:{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, marginBottom:10 },
  select:{ background:'#0f1216', color:'#fff', border:'1px solid #2a2f36', padding:'8px 10px', borderRadius:12 } as React.CSSProperties,
  input:{ background:'#0f1216', color:'#fff', border:'1px solid #2a2f36', padding:'10px 12px', borderRadius:12, width:'100%' } as React.CSSProperties,
  card:{ background:'#1b1e23', border:'1px solid #2a2f36', borderRadius:14, padding:12 } as React.CSSProperties,
  tag:{ padding:'2px 8px', borderRadius:999, background:'#0f1720', border:'1px solid #263041', fontSize:12 }
};

const CITIES = ['Helsingborg','Stockholm','Göteborg','Malmö'] as const;
type SortMode = 'standard' | 'cheapest';

export default function Page(){
  const [city, setCity] = useState<string>('Helsingborg');
  const [sort, setSort] = useState<SortMode>('standard');
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');

  async function load(){
    setLoading(true);
    const url = new URL('/api/nearby', window.location.origin);
    url.searchParams.set('sort', sort === 'cheapest' ? 'cheapest' : 'standard');
    if(city) url.searchParams.set('city', city);
    const res = await fetch(url.toString(), { cache:'no-store' });
    const data = await res.json();
    setVenues(data || []);
    setLoading(false);
  }

  useEffect(()=>{ load(); }, [city, sort]);

  const filtered = useMemo(()=>{
    const t = q.trim().toLowerCase();
    if(!t) return venues;
    return venues.filter(v => (v.name + ' ' + (v.address||'')).toLowerCase().includes(t));
  }, [venues, q]);

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <div style={styles.header}>
          <div style={{display:'flex', alignItems:'center', gap:12}}>
            <img src="/beer/foam-1.jpg" alt="Öl" width={36} height={36} style={{borderRadius:12, objectFit:'cover'}} />
            <div>
              <div style={{fontWeight:700}}>Ölradar</div>
              <div style={{fontSize:12, opacity:.8}}>Hitta bästa ölpriset nära dig</div>
            </div>
          </div>
          <div style={{display:'flex', gap:8, alignItems:'center'}}>
            <select value={city} onChange={e=>setCity(e.target.value)} style={styles.select}>
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={sort} onChange={e=>setSort(e.target.value as SortMode)} style={styles.select}>
              <option value="standard">Standard</option>
              <option value="cheapest">Billigast</option>
            </select>
          </div>
        </div>

        <div style={{marginBottom:12}}>
          <input placeholder="Sök ställe eller stad" value={q} onChange={e=>setQ(e.target.value)} style={styles.input} />
        </div>

        {loading && <div style={{opacity:.7}}>Laddar…</div>}

        <div style={{display:'grid', gap:12}}>
          {filtered.map(v => (
            <div key={v.id} style={styles.card}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', gap:12}}>
                <div>
                  <div style={{fontWeight:600}}>{v.name}</div>
                  <div style={{fontSize:12, opacity:.8}}>{v.city}{v.address ? ' · ' + v.address : ''}</div>
                </div>
                {!!v.deals?.length && (
                  <div style={{fontWeight:700, color:'#22d3ee'}}>
                    {Math.min(...v.deals.map(d=>d.price))} kr
                  </div>
                )}
              </div>
              {v.deals && v.deals.length>0 && (
                <div style={{display:'flex', gap:8, overflowX:'auto', marginTop:10, paddingBottom:4}}>
                  {v.deals.map((d, i) => (
                    <div key={i} style={{minWidth:180, border:'1px solid #2a2f36', borderRadius:10, padding:8}}>
                      <div style={{fontWeight:600}}>{d.beer}</div>
                      <div style={{fontSize:12, opacity:.8}}>{d.style}</div>
                      <div style={{marginTop:4, fontWeight:700}}>{d.price} kr</div>
                      <div style={{fontSize:12}}>⭐ {d.rating ?? 0}</div>
                      {d.verified && <span style={{...styles.tag, marginTop:6, display:'inline-block'}}>Verifierad</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {!filtered.length && !loading && <div style={{opacity:.7}}>Inga fynd ännu. Gör första loggen!</div>}
        </div>

        <div style={{textAlign:'center', fontSize:12, opacity:.6, padding:'32px 0'}}>© 2025 Ölradar</div>
      </div>
    </div>
  );
}
