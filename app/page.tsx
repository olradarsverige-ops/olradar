
'use client';
import { useEffect, useMemo, useRef, useState } from 'react';

type Deal = { beer: string; style: string; price: number; rating: number; updatedAt: string };
type Venue = { id: string; name: string; city: string; deals: Deal[]; openNow: boolean };
type VenueLite = { id: string; name: string; city: string };

const CITIES = ['Helsingborg','Stockholm','Göteborg','Malmö'] as const;
type City = typeof CITIES[number];

// Expanded styles
const STYLES = [
  'Lager','Pilsner','Helles','Kölsch','Märzen','Dunkel','Bock','Doppelbock',
  'IPA','New England IPA','Session IPA','Double IPA','Pale Ale','APA','Amber Ale','Brown Ale',
  'Stout','Imperial Stout','Porter','Oatmeal Stout',
  'Wheat','Hefeweizen','Witbier','Belgian Blonde','Saison',
  'Sour','Berliner Weisse','Gose'
] as const;

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

function useOutsideClick(ref: any, cb: ()=>void){
  useEffect(()=>{
    function handle(e: MouseEvent){ if(ref.current && !ref.current.contains(e.target as Node)) cb(); }
    document.addEventListener('mousedown', handle);
    return ()=>document.removeEventListener('mousedown', handle);
  }, [ref, cb]);
}

function LogModal({ defaultCity, venues, onClose, onSaved }:{ defaultCity: string; venues: Venue[]; onClose: ()=>void; onSaved: ()=>void }){
  const [city, setCity] = useState(defaultCity);
  const [venueName, setVenueName] = useState('');
  const [beer, setBeer] = useState('');
  const [style, setStyle] = useState<string>('Lager');
  const [price, setPrice] = useState(59);
  const [rating, setRating] = useState(4);

  // Suggestions from /api/venues (direct DB) and from nearby deals for beer names
  const [venuePool, setVenuePool] = useState<VenueLite[]>([]);
  useEffect(()=>{
    fetch('/api/venues?city='+encodeURIComponent(city))
      .then(r=>r.json()).then(setVenuePool).catch(()=>setVenuePool([]));
  }, [city]);

  const beerSource = useMemo(() => {
    const s = new Set<string>();
    venues.filter(v=>v.city===city).forEach(v => v.deals?.forEach(d => s.add(d.beer)));
    return Array.from(s).sort();
  }, [venues, city]);

  // simple comboboxes
  const [venueOpen, setVenueOpen] = useState(false);
  const [beerOpen, setBeerOpen] = useState(false);
  const venueBoxRef = useRef<HTMLDivElement>(null);
  const beerBoxRef = useRef<HTMLDivElement>(null);
  useOutsideClick(venueBoxRef, ()=>setVenueOpen(false));
  useOutsideClick(beerBoxRef, ()=>setBeerOpen(false));

  const filteredVenues = useMemo(()=> venuePool
      .filter(v => v.name.toLowerCase().includes(venueName.toLowerCase()))
      .slice(0,8), [venuePool, venueName]);
  const filteredBeers = useMemo(()=> beerSource
      .filter(n => n.toLowerCase().includes(beer.toLowerCase()))
      .slice(0,8), [beerSource, beer]);

  // Point preview: base 5 +10 if first logger for this beer at venue (naive check)
  const existingVenue = useMemo(()=> venues.find(v => v.city===city && v.name.toLowerCase() === venueName.toLowerCase()), [venues, city, venueName]);
  const isFirstLogger = useMemo(()=> {
    if (!existingVenue || !existingVenue.deals) return true;
    return !existingVenue.deals.some(d => d.beer.toLowerCase() === beer.toLowerCase());
  }, [existingVenue, beer]);
  const pointsPreview = 5 + (isFirstLogger ? 10 : 0); // could add +3 if verified later

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
      <div style={{background:'#fff', border:'1px solid #ddd', borderRadius:12, padding:14, width:'100%', maxWidth:500}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <div style={{fontWeight:700}}>Logga en öl</div>
          <button onClick={onClose} style={{color:'#666'}}>✕</button>
        </div>
        <div style={{display:'grid', gap:8, marginTop:8}}>
          {/* Stad */}
          <select value={city} onChange={e=>setCity(e.target.value)}>
            {['Helsingborg','Stockholm','Göteborg','Malmö'].map(c=><option key={c} value={c}>{c}</option>)}
          </select>

          {/* Venue combobox (direct DB) */}
          <div ref={venueBoxRef} style={{position:'relative'}}>
            <input
              value={venueName}
              onChange={e=>{ setVenueName(e.target.value); setVenueOpen(true); }}
              onFocus={()=>setVenueOpen(true)}
              placeholder="Ställe (ex. Charles Dickens) – välj eller skriv nytt"
              style={{width:'100%', padding:'8px 10px', border:'1px solid #ddd', borderRadius:10}}
            />
            {venueOpen && filteredVenues.length>0 && (
              <div style={{position:'absolute', zIndex:20, top:'100%', left:0, right:0, background:'#fff', border:'1px solid #ddd', borderRadius:10, marginTop:4, maxHeight:200, overflow:'auto'}}>
                {filteredVenues.map(v=>(
                  <div key={v.id} onMouseDown={()=>{ setVenueName(v.name); setVenueOpen(false); }} style={{padding:'8px 10px', cursor:'pointer'}}>{v.name}</div>
                ))}
              </div>
            )}
          </div>

          {/* Beer combobox (from nearby) */}
          <div ref={beerBoxRef} style={{position:'relative'}}>
            <input
              value={beer}
              onChange={e=>{ setBeer(e.target.value); setBeerOpen(true); }}
              onFocus={()=>setBeerOpen(true)}
              placeholder="Ölnamn (ex. Mariestads) – välj eller skriv nytt"
              style={{width:'100%', padding:'8px 10px', border:'1px solid #ddd', borderRadius:10}}
            />
            {beerOpen && filteredBeers.length>0 && (
              <div style={{position:'absolute', zIndex:20, top:'100%', left:0, right:0, background:'#fff', border:'1px solid #ddd', borderRadius:10, marginTop:4, maxHeight:200, overflow:'auto'}}>
                {filteredBeers.map(n=>(
                  <div key={n} onMouseDown={()=>{ setBeer(n); setBeerOpen(false); }} style={{padding:'8px 10px', cursor:'pointer'}}>{n}</div>
                ))}
              </div>
            )}
          </div>

          {/* Style dropdown (expanded list) */}
          <select value={style} onChange={e=>setStyle(e.target.value)} style={{padding:'8px 10px', border:'1px solid #ddd', borderRadius:10}}>
            {STYLES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          {/* Price with suffix */}
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

          {/* Rating with live number and points preview */}
          <div style={{display:'flex', alignItems:'center', gap:8}}>
            <input type="range" min={0} max={5} step={0.5} value={rating} onChange={e=>setRating(parseFloat(e.target.value))} style={{flex:1}}/>
            <div style={{minWidth:120, textAlign:'right'}}>
              <div>⭐ {rating.toFixed(1)}</div>
              <div style={{fontWeight:700, color:'#0a7f5a'}}>+{pointsPreview} p</div>
            </div>
          </div>
        </div>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:10}}>
          <div style={{fontSize:12, color:'#666'}}>Poäng: 5 bas {isFirstLogger ? '+ 10 först på plats' : ''}</div>
          <div style={{display:'flex', gap:8}}>
            <button onClick={onClose} style={{padding:'8px 12px', borderRadius:10, border:'1px solid #ddd'}}>Avbryt</button>
            <button onClick={save} style={{padding:'8px 12px', borderRadius:10, background:'#059669', color:'#fff', fontWeight:700}}>Spara</button>
          </div>
        </div>
      </div>
    </div>
  );
}
