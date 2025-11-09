
'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

type Deal = { beer: string; style: string; price: number; rating: number; updatedAt: string; verified?: boolean; photoUrl?: string|null };
type Venue = { id: string; name: string; city: string; lat?: number|null; lng?: number|null; deals: Deal[]; openNow: boolean };
type VenueLite = { id: string; name: string; city: string; lat?: number|null; lng?: number|null };

const CITIES = ['Helsingborg','Stockholm','Göteborg','Malmö'] as const;
type City = typeof CITIES[number];

const STYLES = [
  'Lager','Pilsner','Helles','Kölsch','Märzen','Dunkel','Bock','Doppelbock',
  'IPA','New England IPA','Session IPA','Double IPA','Pale Ale','APA','Amber Ale','Brown Ale',
  'Stout','Imperial Stout','Porter','Oatmeal Stout',
  'Wheat','Hefeweizen','Witbier','Belgian Blonde','Saison',
  'Sour','Berliner Weisse','Gose'
] as const;

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

function haversineKm(a:{lat:number,lng:number}, b:{lat:number,lng:number}){
  const toRad = (x:number)=>x*Math.PI/180;
  const R=6371;
  const dLat=toRad(b.lat-a.lat), dLng=toRad(b.lng-a.lng);
  const s=Math.sin(dLat/2)**2 + Math.cos(toRad(a.lat))*Math.cos(toRad(b.lat))*Math.sin(dLng/2)**2;
  return 2*R*Math.asin(Math.sqrt(s));
}

export default function Page(){
  const [city, setCity] = useState<City>('Helsingborg');
  const [venues, setVenues] = useState<Venue[]>([]);
  const [q, setQ] = useState('');
  const [style, setStyle] = useState('');
  const [sort, setSort] = useState<'default'|'cheap'>('default');
  const [openLog, setOpenLog] = useState(false);

  async function load(){
    const res = await fetch('/api/nearby?city=' + encodeURIComponent(city));
    const data = await res.json();
    setVenues(data || []);
  }
  useEffect(()=>{ load(); }, [city]);

  const filtered = useMemo(()=>{
    let list = venues.filter(v => {
      const t = (v.name + ' ' + v.city).toLowerCase().includes(q.toLowerCase());
      const okStyle = style ? v.deals?.some(d=>d.style===style) : true;
      return t && okStyle;
    });
    if (sort==='cheap'){
      list = [...list].sort((a,b)=>{
        const minA = a.deals?.length? Math.min(...a.deals.map(d=>d.price)) : Number.POSITIVE_INFINITY;
        const minB = b.deals?.length? Math.min(...b.deals.map(d=>d.price)) : Number.POSITIVE_INFINITY;
        return minA - minB;
      });
    }
    return list;
  }, [venues, q, style, sort]);

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
        <select value={sort} onChange={e=>setSort(e.target.value as any)} style={{padding:'8px 10px', borderRadius:10, border:'1px solid #ddd'}}>
          <option value="default">Standard</option>
          <option value="cheap">Billigast först</option>
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
                <div key={i} style={{minWidth:200, border:'1px solid #eee', borderRadius:10, padding:10, position:'relative'}}>
                  {d.verified && <span style={{position:'absolute', top:6, right:6, background:'#dcfce7', color:'#166534', fontSize:10, padding:'2px 6px', borderRadius:999}}>Verifierad</span>}
                  {d.photoUrl && <span title="Foto finns" style={{position:'absolute', top:6, left:6, fontSize:12}}>📷</span>}
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
  const [verified, setVerified] = useState(false);
  const [photo, setPhoto] = useState<File|null>(null);
  const [photoPreview, setPhotoPreview] = useState<string|null>(null);
  const [coords, setCoords] = useState<{lat:number; lng:number}|null>(null);
  const [uploading, setUploading] = useState(false);
  const [venuePool, setVenuePool] = useState<VenueLite[]>([]);
  const [distanceOk, setDistanceOk] = useState(true);

  useEffect(()=>{
    fetch('/api/venues?city='+encodeURIComponent(city))
      .then(r=>r.json()).then(setVenuePool).catch(()=>setVenuePool([]));
  }, [city]);

  const beerSource = useMemo(() => {
    const s = new Set<string>();
    venues.filter(v=>v.city===city).forEach(v => v.deals?.forEach(d => s.add(d.beer)));
    return Array.from(s).sort();
  }, [venues, city]);

  const [venueOpen, setVenueOpen] = useState(false);
  const [beerOpen, setBeerOpen] = useState(false);
  const venueBoxRef = useRef<HTMLDivElement>(null);
  const beerBoxRef = useRef<HTMLDivElement>(null);
  useOutsideClick(venueBoxRef, ()=>setVenueOpen(false));
  useOutsideClick(beerBoxRef, ()=>setBeerOpen(false));

  const topVenues = useMemo(()=> venuePool.map(v=>v.name).slice(0,8), [venuePool]);
  const filteredVenues = useMemo(()=>{
    const q = venueName.trim().toLowerCase();
    if (!q) return topVenues;
    return venuePool.filter(v => v.name.toLowerCase().includes(q)).map(v=>v.name).slice(0,8);
  }, [venuePool, venueName, topVenues]);

  const filteredBeers = useMemo(()=> beerSource
      .filter(n => n.toLowerCase().includes(beer.toLowerCase()))
      .slice(0,8), [beerSource, beer]);

  useEffect(()=>{
    if (!verified) { setCoords(null); setDistanceOk(true); return; }
    if (!navigator.geolocation) { setCoords(null); setDistanceOk(false); return; }
    navigator.geolocation.getCurrentPosition(
      (pos)=> {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(c);
        const v = venuePool.find(x => x.name.toLowerCase() === venueName.toLowerCase());
        if (v && v.lat && v.lng){
          const km = haversineKm(c, {lat: v.lat, lng: v.lng});
          setDistanceOk(km <= 0.1);
        } else {
          setDistanceOk(false);
        }
      },
      ()=> { setCoords(null); setDistanceOk(false); },
      { enableHighAccuracy: true, maximumAge: 60000, timeout: 8000 }
    );
  }, [verified, venueName, venuePool]);

  const existingVenue = useMemo(()=> venues.find(v => v.city===city && v.name.toLowerCase() === venueName.toLowerCase()), [venues, city, venueName]);
  const isFirstLogger = useMemo(()=> {
    if (!existingVenue || !existingVenue.deals) return true;
    return !existingVenue.deals.some(d => d.beer.toLowerCase() === beer.toLowerCase());
  }, [existingVenue, beer]);
  const pointsPreview = 5 + (isFirstLogger ? 10 : 0) + (verified ? 3 : 0);

  function onPhoto(e: React.ChangeEvent<HTMLInputElement>){
    const f = e.target.files?.[0] || null;
    setPhoto(f);
    setPhotoPreview(f ? URL.createObjectURL(f) : null);
  }

  async function uploadPhotoIfAny(venueId: string){
    if (!photo) return null;
    setUploading(true);
    const ext = photo.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${venueId}/${crypto.randomUUID()}.${ext}`;
    const { data, error } = await supabase.storage.from('photos').upload(fileName, photo, {
      cacheControl: '3600',
      upsert: false,
      contentType: photo.type || 'image/jpeg'
    });
    setUploading(false);
    if (error) return null;
    const { data: pub } = supabase.storage.from('photos').getPublicUrl(data.path);
    return pub?.publicUrl || null;
  }

  async function save(){
    const venueId = (venueName || 'okand').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
    const photoUrl = await uploadPhotoIfAny(venueId);
    await fetch('/api/log', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        city, venueName, beerName: beer, style, price, rating,
        verified, photoUrl, coords
      })
    });
    onSaved();
  }

  const canSave = (!verified || distanceOk) && !!venueName && !!beer && price>0;

  return (
    <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,.3)', display:'grid', placeItems:'center', padding:12}}>
      <div style={{background:'#fff', border:'1px solid #ddd', borderRadius:12, padding:14, width:'100%', maxWidth:560}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <div style={{fontWeight:700}}>Logga en öl</div>
          <button onClick={onClose} style={{color:'#666'}}>✕</button>
        </div>
        <div style={{display:'grid', gap:8, marginTop:8}}>
          <select value={city} onChange={e=>setCity(e.target.value)}>
            {['Helsingborg','Stockholm','Göteborg','Malmö'].map(c=><option key={c} value={c}>{c}</option>)}
          </select>

          <div ref={venueBoxRef} style={{position:'relative'}}>
            <input
              value={venueName}
              onChange={e=>{ setVenueName(e.target.value); setVenueOpen(true); }}
              onFocus={()=>setVenueOpen(true)}
              placeholder="Ställe – välj från listan eller skriv nytt"
              style={{width:'100%', padding:'8px 10px', border:'1px solid #ddd', borderRadius:10}}
            />
            {venueOpen && (
              <div style={{position:'absolute', zIndex:20, top:'100%', left:0, right:0, background:'#fff', border:'1px solid #ddd', borderRadius:10, marginTop:4, maxHeight:220, overflow:'auto'}}>
                {filteredVenues.map(n=>(
                  <div key={n} onMouseDown={()=>{ setVenueName(n); setVenueOpen(false); }} style={{padding:'8px 10px', cursor:'pointer'}}>{n}</div>
                ))}
                {venueName and not filteredVenues.__contains__(venueName) and (
                  <div onMouseDown={()=>{ setVenueName(venueName); setVenueOpen(false); }} style={{padding:'8px 10px', cursor:'pointer', color:'#065f46', borderTop:'1px solid #eee'}}>
                    + Skapa nytt ställe: “{venueName}”
                  </div>
                )}
              </div>
            )}
          </div>

          <div ref={beerBoxRef} style={{position:'relative'}}>
            <input
              value={beer}
              onChange={e=>{ setBeer(e.target.value); setBeerOpen(true); }}
              onFocus={()=>setBeerOpen(true)}
              placeholder="Ölnamn – välj från listan eller skriv nytt"
              style={{width:'100%', padding:'8px 10px', border:'1px solid #ddd', borderRadius:10}}
            />
            {beerOpen && filteredBeers.length>0 && (
              <div style={{position:'absolute', zIndex:20, top:'100%', left:0, right:0, background:'#fff', border:'1px solid #ddd', borderRadius:10, marginTop:4, maxHeight:220, overflow:'auto'}}>
                {filteredBeers.map(n=>(
                  <div key={n} onMouseDown={()=>{ setBeer(n); setBeerOpen(false); }} style={{padding:'8px 10px', cursor:'pointer'}}>{n}</div>
                ))}
              </div>
            )}
          </div>

          <select value={style} onChange={e=>setStyle(e.target.value)} style={{padding:'8px 10px', border:'1px solid #ddd', borderRadius:10}}>
            {STYLES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

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

          <div style={{display:'flex', alignItems:'center', gap:8}}>
            <input type="range" min={0} max={5} step={0.5} value={rating} onChange={e=>setRating(parseFloat(e.target.value))} style={{flex:1}}/>
            <div style={{minWidth:140, textAlign:'right'}}>
              <div>⭐ {rating.toFixed(1)}</div>
              <div style={{fontWeight:700, color:'#0a7f5a'}}>+{5 + ( (venues.find(v => v.name.toLowerCase()===venueName.toLowerCase())?.deals.some(d=>d.beer.toLowerCase()===beer.toLowerCase()) ? 0 : 10) ) + (verified?3:0)} p</div>
            </div>
          </div>

          <div style={{border:'1px dashed #ddd', borderRadius:10, padding:10}}>
            <label style={{display:'flex', alignItems:'center', gap:8}}>
              <input type="checkbox" checked={verified} onChange={e=>setVerified(e.target.checked)} />
              Verifierad med foto/GPS (+3 p)
            </label>
            {verified && (
              <div style={{display:'grid', gap:8, marginTop:8}}>
                <input type="file" accept="image/*" onChange={onPhoto} />
                {photoPreview && <img src={photoPreview} alt="preview" style={{maxWidth:220, borderRadius:8, border:'1px solid #eee'}} />}
                <div style={{fontSize:12}}>
                  {coords ? `GPS: ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}` : 'GPS ej tillgänglig'}
                </div>
              </div>
            )}
          </div>
        </div>
        <div style={{display:'flex', justifyContent:'flex-end', gap:8, marginTop:10}}>
          <button onClick={onClose} style={{padding:'8px 12px', borderRadius:10, border:'1px solid #ddd'}}>Avbryt</button>
          <button onClick={save} disabled={!((!verified || distanceOk) && !!venueName && !!beer && price>0) || uploading} style={{padding:'8px 12px', borderRadius:10, background: ((!verified || distanceOk) && !!venueName && !!beer && price>0 && !uploading)?'#059669':'#9ca3af', color:'#fff', fontWeight:700}}>
            {uploading ? 'Laddar upp...' : 'Spara'}
          </button>
        </div>
      </div>
    </div>
  );
}
