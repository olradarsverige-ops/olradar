
'use client';
import { useEffect, useMemo, useState } from 'react';

type Deal = { beer: string; style: string; price: number; rating: number; updatedAt: string };
type Venue = { id: string; name: string; city: string; deals: Deal[]; openNow: boolean };

const CITIES = ['Helsingborg','Stockholm','Göteborg','Malmö'] as const;
type City = typeof CITIES[number];
const STYLES = ['Lager','IPA','Pilsner','Stout'] as const;

export default function Page(){
  const [city, setCity] = useState<City>('Helsingborg');
  const [venues, setVenues] = useState<Venue[]>([]);
  const [q, setQ] = useState('');
  const [style, setStyle] = useState('');
  const [openLog, setOpenLog] = useState(false);

  async function load(){
    const res = await fetch('/api/nearby?city=' + encodeURIComponent(city));
    const data = await res.json();
    setVenues(data || []);
  }
  useEffect(()=>{ load(); }, [city]);

  const filtered = useMemo(()=>{
    return venues.filter(v => {
      const t = (v.name + ' ' + v.city).toLowerCase().includes(q.toLowerCase());
      const okStyle = style ? v.deals?.some(d=>d.style===style) : true;
      return t && okStyle;
    });
  }, [venues, q, style]);

  return (
    <main style={{maxWidth:1000,margin:'20px auto',padding:'0 16px'}}>
      <header style={{display:'flex',alignItems:'center',justifyContent:'space-between', gap: 12}}>
        <div style={{display:'flex', alignItems:'center', gap:12}}>
          <select value={city} onChange={e=>setCity(e.target.value as City)}>
            {CITIES.map(c=><option key={c} value={c}>{c}</option>)}
          </select>
          <div>
            <div style={{fontWeight:700}}>Ölradar</div>
            <div style={{fontSize:12, color:'#666'}}>Hitta bästa ölpriset nära dig</div>
          </div>
        </div>
        <button onClick={()=>setOpenLog(true)} style={{padding:'8px 14px', borderRadius:10, background:'#059669', color:'#fff', fontWeight:700}}>+ Logga öl</button>
      </header>

      <div style={{display:'flex', gap:8, margin:'12px 0'}}>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Sök ställe eller stad" style={{flex:1, padding:'8px 10px', borderRadius:10, border:'1px solid #ddd'}}/>
        <select value={style} onChange={e=>setStyle(e.target.value)} style={{padding:'8px 10px', borderRadius:10, border:'1px solid #ddd'}}>
          <option value="">Alla stilar</option>
          {STYLES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="grid" style={{display:'grid', gridTemplateColumns:'1fr', gap:12}}>
        {filtered.map(v=>(
          <div key={v.id} style={{border:'1px solid #e5e5e5', borderRadius:12, padding:12}}>
            <div style={{display:'flex', justifyContent:'space-between'}}>
              <div><b>{v.name}</b><div style={{color:'#666'}}>{v.city}</div></div>
              <div><b style={{color:'#0a7f5a'}}>{v.deals?.length ? Math.min(...v.deals.map(d=>d.price)) : '–'} kr</b></div>
            </div>
            <div style={{display:'flex', gap:8, overflowX:'auto', marginTop:8}}>
              {v.deals?.map((d,i)=>(
                <div key={i} style={{minWidth:200, border:'1px solid #eee', borderRadius:10, padding:10}}>
                  <div style={{fontWeight:600, fontSize:14}}>{d.beer}</div>
                  <div style={{fontSize:12, color:'#666'}}>{d.style}</div>
                  <div style={{fontWeight:600}}>{d.price} kr</div>
                  <div style={{fontSize:12}}>⭐ {d.rating}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {filtered.length===0 && <div style={{color:'#666'}}>Inga fynd ännu här. Logga första ölen!</div>}
      </div>

      {openLog && (
        <LogModal
          defaultCity={city}
          venues={venues}
          onClose={()=>setOpenLog(false)}
          onSaved={()=>{ setOpenLog(false); load(); }}
        />
      )}
    </main>
  );
}

function LogModal({ defaultCity, venues, onClose, onSaved }:{ defaultCity: string; venues: Venue[]; onClose: ()=>void; onSaved: ()=>void }){
  const [city, setCity] = useState(defaultCity);
  const [venueName, setVenueName] = useState('');
  const [beer, setBeer] = useState('');
  const [style, setStyle] = useState<typeof STYLES[number]>('Lager');
  const [price, setPrice] = useState(59);
  const [rating, setRating] = useState(4);

  // lista med befintliga ställen i vald stad (förslag)
  const venueOptions = useMemo(() => {
    return venues.filter(v => v.city === city).map(v => v.name).sort();
  }, [venues, city]);

  async function save(){
    await fetch('/api/log', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ city, venueName, beerName: beer, style, price, rating, verified:false, photoUrl:null })
    });
    onSaved();
  }

  return (
    <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,.3)', display:'grid', placeItems:'center', padding:12}}>
      <div style={{background:'#fff', border:'1px solid #ddd', borderRadius:12, padding:14, width:'100%', maxWidth:460}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <div style={{fontWeight:700}}>Logga en öl</div>
          <button onClick={onClose} style={{color:'#666'}}>✕</button>
        </div>
        <div style={{display:'grid', gap:8, marginTop:8}}>
          {/* Stad */}
          <select value={city} onChange={e=>setCity(e.target.value)}>
            {['Helsingborg','Stockholm','Göteborg','Malmö'].map(c=><option key={c} value={c}>{c}</option>)}
          </select>

          {/* Ställe – med datalist/auto-complete */}
          <input
            value={venueName}
            onChange={e=>setVenueName(e.target.value)}
            list="venue-list"
            placeholder="Ställe (ex. Charles Dickens) – välj eller skriv nytt"
            style={{padding:'8px 10px', border:'1px solid #ddd', borderRadius:10}}
          />
          <datalist id="venue-list">
            {venueOptions.map(n => <option key={n} value={n} />)}
          </datalist>

          {/* Ölnamn (inte stil) */}
          <input
            value={beer}
            onChange={e=>setBeer(e.target.value)}
            placeholder="Ölnamn (ex. Mariestads)"
            style={{padding:'8px 10px', border:'1px solid #ddd', borderRadius:10}}
          />

          {/* Stil – EN dropdown (inte dubbelt) */}
          <select value={style} onChange={e=>setStyle(e.target.value as any)} style={{padding:'8px 10px', border:'1px solid #ddd', borderRadius:10}}>
            {STYLES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          {/* Pris – med "kr" suffix */}
          <div style={{position:'relative'}}>
            <input
              type="number"
              value={price}
              min={20}
              max={200}
              onChange={e=>setPrice(parseInt(e.target.value||'0'))}
              placeholder="Pris"
              style={{width:'100%', padding:'8px 36px 8px 10px', border:'1px solid #ddd', borderRadius:10}}
            />
            <span style={{position:'absolute', right:10, top:8, color:'#555'}}>kr</span>
          </div>

          {/* Betyg – visa aktuell siffra */}
          <div style={{display:'flex', alignItems:'center', gap:8}}>
            <input type="range" min={0} max={5} step={0.5} value={rating} onChange={e=>setRating(parseFloat(e.target.value))} style={{flex:1}}/>
            <div style={{minWidth:48, textAlign:'right'}}>⭐ {rating.toFixed(1)}</div>
          </div>
        </div>
        <div style={{display:'flex', justifyContent:'flex-end', gap:8, marginTop:10}}>
          <button onClick={onClose} style={{padding:'8px 12px', borderRadius:10, border:'1px solid #ddd'}}>Avbryt</button>
          <button onClick={save} style={{padding:'8px 12px', borderRadius:10, background:'#059669', color:'#fff', fontWeight:700}}>Spara</button>
        </div>
      </div>
    </div>
  );
}
