
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
    <main className="min-h-screen bg-gradient-to-b from-amber-50 to-emerald-50">
      <style>{`
        .container{max-width:1000px;margin:0 auto;padding:16px}
        .card{border:1px solid #e5e7eb;border-radius:16px;background:#fff;box-shadow:0 2px 10px rgba(0,0,0,.05)}
        .btn{padding:10px 16px;border-radius:12px;font-weight:700}
        .btn-primary{background:#059669;color:white}
        .pill{border:1px solid #e5e7eb;border-radius:9999px;padding:6px 10px;background:#fff}
        .badge{font-size:10px;padding:2px 6px;border-radius:999px}
      `}</style>

      <header className="container" style={{display:'flex',alignItems:'center',justifyContent:'space-between', gap:12, paddingTop:12}}>
        <div style={{display:'flex', alignItems:'center', gap:12}}>
          <img src="https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=160&auto=format&fit=crop" alt="beer" style={{width:40,height:40,borderRadius:12,objectFit:'cover'}}/>
          <div>
            <div style={{fontWeight:800,fontSize:18}}>Ölradar</div>
            <div style={{fontSize:12, color:'#666'}}>Hitta bästa ölpriset nära dig</div>
          </div>
        </div>
        <div style={{display:'flex', gap:8, alignItems:'center'}}>
          <select className="pill" value={city} onChange={e=>setCity(e.target.value as City)}>
            {CITIES.map(c=><option key={c} value={c}>{c}</option>)}
          </select>
          <button className="btn btn-primary" onClick={()=>setOpenLog(true)}>+ Logga öl</button>
        </div>
      </header>

      <div className="container" style={{display:'flex', gap:8, margin:'12px 0'}}>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Sök ställe eller stad" className="pill" style={{flex:1}}/>
        <select className="pill" value={style} onChange={e=>setStyle(e.target.value)}>
          <option value="">Alla stilar</option>
          {STYLES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="pill" value={sort} onChange={e=>setSort(e.target.value as any)}>
          <option value="default">Standard</option>
          <option value="cheap">Billigast först</option>
        </select>
      </div>

      <div className="container" style={{display:'grid', gridTemplateColumns:'1fr', gap:12}}>
        {/* hero images row */}
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
          <img className="card" src="https://images.unsplash.com/photo-1517705008128-361805f42e86?q=80&w=1200&auto=format&fit=crop" alt="" style={{height:120, objectFit:'cover'}}/>
          <img className="card" src="https://images.unsplash.com/photo-1541552781282-6d10c0bca8b3?q=80&w=1200&auto=format&fit=crop" alt="" style={{height:120, objectFit:'cover'}}/>
        </div>

        {filtered.map(v=>(
          <div key={v.id} className="card" style={{padding:14}}>
            <div style={{display:'flex', justifyContent:'space-between'}}>
              <div><b>{v.name}</b><div style={{color:'#666'}}>{v.city}</div></div>
              <div><b style={{color:'#0a7f5a'}}>{v.deals?.length ? Math.min(...v.deals.map(d=>d.price)) : '–'} kr</b></div>
            </div>
            <div style={{display:'flex', gap:8, overflowX:'auto', marginTop:8}}>
              {v.deals?.map((d,i)=>(
                <div key={i} className="card" style={{minWidth:220, padding:10, position:'relative'}}>
                  {d.verified && <span className="badge" style={{position:'absolute', top:6, right:6, background:'#dcfce7', color:'#166534'}}>Verifierad</span>}
                  {d.photoUrl && <span title="Foto finns" style={{position:'absolute', top:6, left:10}}>📷</span>}
                  <div style={{fontWeight:700}}>{d.beer}</div>
                  <div style={{fontSize:12, color:'#666'}}>{d.style}</div>
                  <div style={{fontWeight:700}}>{d.price} kr</div>
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
  const [showInfo, setShowInfo] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');

  // Preload venues for the selected city
  useEffect(()=>{
    fetch('/api/venues?city='+encodeURIComponent(city))
      .then(r=>r.json()).then((data)=>{
        setVenuePool(Array.isArray(data)?data:[]);
      }).catch(()=>setVenuePool([]));
  }, [city]);

  // Suggest list
  const [venueOpen, setVenueOpen] = useState(false);
  const venueBoxRef = useRef<HTMLDivElement>(null);
  useOutsideClick(venueBoxRef, ()=>setVenueOpen(false));

  const topVenues = useMemo(()=> venuePool.map(v=>v.name).slice(0,8), [venuePool]);
  const filteredVenues = useMemo(()=>{
    const q = venueName.trim().toLowerCase();
    if (!q) return topVenues;
    return venuePool.filter(v => v.name.toLowerCase().includes(q)).map(v=>v.name).slice(0,8);
  }, [venuePool, venueName, topVenues]);

  // Beers source (from visible list)
  const beerSource = useMemo(() => {
    const s = new Set<string>();
    venues.filter(v=>v.city===city).forEach(v => v.deals?.forEach(d => s.add(d.beer)));
    return Array.from(s).sort();
  }, [venues, city]);
  const [beerOpen, setBeerOpen] = useState(false);
  const beerBoxRef = useRef<HTMLDivElement>(null);
  useOutsideClick(beerBoxRef, ()=>setBeerOpen(false));
  const filteredBeers = useMemo(()=> beerSource.filter(n => n.toLowerCase().includes(beer.toLowerCase())).slice(0,8), [beerSource, beer]);

  // Verified gps
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

  async function upsertVenueCoords(){
    const body = { name: venueName.trim(), city, lat: parseFloat(lat), lng: parseFloat(lng) };
    await fetch('/api/admin/upsert-venue', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
    // refresh list
    const res = await fetch('/api/venues?city='+encodeURIComponent(city));
    const data = await res.json();
    setVenuePool(Array.isArray(data)?data:[]);
  }

  const isNewVenue = venueName.trim().length>0 && !venuePool.some(v => v.name.toLowerCase()===venueName.toLowerCase());
  const canSave = (!verified || distanceOk) && !!venueName && !!beer && price>0;
  const pointsPreview = 5 + (verified?3:0) + 10; // simple preview (first logger bonus optimistic)

  return (
    <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,.3)', display:'grid', placeItems:'center', padding:12}}>
      <div className="card" style={{padding:14, width:'100%', maxWidth:640}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <div style={{fontWeight:700, fontSize:16}}>Logga en öl</div>
          <button onClick={onClose} className="pill">✕</button>
        </div>
        <div style={{display:'grid', gap:10, marginTop:10}}>
          <div style={{display:'grid', gap:8, gridTemplateColumns:'1fr 1fr'}}>
            <select className="pill" value={city} onChange={e=>setCity(e.target.value)}>
              {['Helsingborg','Stockholm','Göteborg','Malmö'].map(c=><option key={c} value={c}>{c}</option>)}
            </select>
            <div ref={venueBoxRef} style={{position:'relative'}}>
              <input className="pill" value={venueName}
                onChange={e=>{ setVenueName(e.target.value); setVenueOpen(true); setShowInfo(false); }}
                onFocus={()=>setVenueOpen(true)}
                placeholder="Ställe – välj från listan eller skriv nytt" />
              {venueOpen && (
                <div className="card" style={{position:'absolute', zIndex:30, top:'110%', left:0, right:0, maxHeight:220, overflow:'auto', padding:6}}>
                  {filteredVenues.map(n=>(
                    <div key={n} className="pill" style={{margin:4, cursor:'pointer'}} onMouseDown={()=>{ setVenueName(n); setVenueOpen(false); }}>
                      {n}
                    </div>
                  ))}
                  {isNewVenue && (
                    <div className="pill" style={{margin:4, cursor:'pointer', background:'#ecfeff', borderColor:'#a5f3fc'}}
                      onMouseDown={()=>{ setShowInfo(true); setVenueOpen(false); }}>
                      + Skapa nytt ställe: “{venueName}”
                    </div>
                  )}
                  {filteredVenues.length===0 && !isNewVenue && <div style={{padding:8, color:'#666'}}>Inga ställen i listan.</div>}
                </div>
              )}
            </div>
          </div>

          {/* Info puck if creating new */}
          {showInfo && (
            <div className="card" style={{padding:10, background:'#fff7ed', borderColor:'#fed7aa'}}>
              <b>Obs!</b> För att kunna markera loggen som <i>Verifierad</i> behöver stället ha koordinater (lat/lng).
              Lägg in koordinater nedan så funkar GPS-checken direkt.
              <div style={{marginTop:8}}>
                <button className="pill" onClick={()=>setAdminOpen(v=>!v)}>{adminOpen? 'Dölj admin' : 'Öppna mini-admin (lat/lng)'}</button>
              </div>
            </div>
          )}

          {/* Mini admin for lat/lng */}
          {adminOpen && (
            <div className="card" style={{padding:10}}>
              <div style={{fontWeight:600, marginBottom:6}}>Sätt koordinater för “{venueName}”</div>
              <div style={{display:'grid', gap:8, gridTemplateColumns:'1fr 1fr'}}>
                <input className="pill" placeholder="Latitud" value={lat} onChange={e=>setLat(e.target.value)} />
                <input className="pill" placeholder="Longitud" value={lng} onChange={e=>setLng(e.target.value)} />
              </div>
              <div style={{marginTop:8, display:'flex', gap:8}}>
                <button className="btn btn-primary" onClick={upsertVenueCoords}>Spara koordinater</button>
                <div style={{fontSize:12, color:'#666'}}>Tips: Hämta via Google Maps → högerklick → kopiera lat/lng.</div>
              </div>
            </div>
          )}

          {/* Beer + style */}
          <div ref={beerBoxRef} style={{position:'relative'}}>
            <input className="pill" value={beer} onChange={e=>{ setBeer(e.target.value); setBeerOpen(true); }}
              onFocus={()=>setBeerOpen(true)} placeholder="Ölnamn – välj från listan eller skriv nytt" />
            {beerOpen && filteredBeers.length>0 && (
              <div className="card" style={{position:'absolute', zIndex:30, top:'110%', left:0, right:0, maxHeight:220, overflow:'auto', padding:6}}>
                {filteredBeers.map(n=>(
                  <div key={n} className="pill" style={{margin:4, cursor:'pointer'}} onMouseDown={()=>{ setBeer(n); setBeerOpen(false); }}>{n}</div>
                ))}
              </div>
            )}
          </div>

          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
            <select className="pill" value={style} onChange={e=>setStyle(e.target.value)}>
              {STYLES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <div style={{position:'relative'}}>
              <input className="pill" type="number" value={price} min={20} max={200} onChange={e=>setPrice(parseInt(e.target.value||'0'))} placeholder="Pris" />
              <span style={{position:'absolute', right:16, top:10, color:'#555'}}>kr</span>
            </div>
          </div>

          <div style={{display:'flex', alignItems:'center', gap:8}}>
            <input type="range" min={0} max={5} step={0.5} value={rating} onChange={e=>setRating(parseFloat(e.target.value))} style={{flex:1}}/>
            <div style={{minWidth:160, textAlign:'right'}}>
              <div>⭐ {rating.toFixed(1)}</div>
              <div style={{fontWeight:700, color:'#0a7f5a'}}>+{pointsPreview} p</div>
            </div>
          </div>

          <div className="card" style={{padding:10}}>
            <label style={{display:'flex', alignItems:'center', gap:8}}>
              <input type="checkbox" checked={verified} onChange={e=>setVerified(e.target.checked)} />
              Verifierad med foto/GPS (+3 p)
            </label>
            {verified && (
              <div style={{display:'grid', gap:8, marginTop:8}}>
                <input type="file" accept="image/*" onChange={onPhoto} />
                {photoPreview && <img src={photoPreview} alt="preview" style={{maxWidth:220, borderRadius:8, border:'1px solid #eee'}} />}
                <div style={{fontSize:12, color: distanceOk ? '#166534' : '#991b1b'}}>
                  {coords ? `GPS: ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}` : 'GPS ej tillgänglig'} · {distanceOk ? 'Avstånd OK (<100 m)' : 'För långt från stället / saknar koordinater'}
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{display:'flex', justifyContent:'flex-end', gap:8, marginTop:10}}>
          <button onClick={onClose} className="pill">Avbryt</button>
          <button onClick={save} disabled={!canSave || uploading} className="btn btn-primary">
            {uploading ? 'Laddar upp...' : 'Spara'}
          </button>
        </div>
      </div>
    </div>
  );
}
