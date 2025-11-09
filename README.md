
# Ölradar – Helsingborg Starter (SE/EN) ✅

Det här paketet är klart att köras med **Helsingborg som default** + en **stadsväljare** i UI:t.
Innehåller:
- Next.js (App Router) + minimal UI
- API: `GET /api/nearby` och `POST /api/log`
- Uppdaterad **supabase/schema.sql** (policies fixade) + seed för **Helsingborg**
- .env.example

---

## 1) Supabase (gratis)
1. Skapa projekt → öppna **SQL Editor**.
2. Klistra in innehållet från **`supabase/schema.sql`** → **Run**.
   - Tabeller: `venues`, `beers`, `prices`
   - Vy: `vw_nearby`
3. Hämta **Project URL** + **anon key** (Project Settings → API).

## 2) Kör lokalt (om du vill)
```bash
npm install
# Skapa .env.local baserat på .env.example
npm run dev
# http://localhost:3000
```

## 3) Vercel (gratis)
- Skapa nytt repo på GitHub, ladda upp allt i denna mapp.
- I Vercel: Importera repo → lägg env-variabler:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Deploy.
- Testa `https://din-app.vercel.app/api/nearby?city=Helsingborg`

## 4) Användning
- Uppe till vänster finns **stadsväljare** (Helsingborg, Stockholm, Göteborg, Malmö).
- **+ Logga öl** öppnar modal: välj stad + skriv *ställenamn*, öl, stil, pris, betyg → **Spara**.
- API upsertar bar och öl om de inte finns.

Lycka till! 🍻
