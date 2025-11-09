
# Ölradar v10 (SE/EN)

- Mörkgrå tema, vit text i inputs
- Bildfallback + Next images whitelisting
- Vy-växlare: **Standard** / **Billigast**
- API-routes: `/api/venues` och `/api/nearby?sort=cheapest&city=Helsingborg`

## Miljövariabler (Vercel)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Start lokalt
```bash
npm i
npm run dev
```

## Deploy
- Koppla GitHub → Vercel → lägg env-variabler → Deploy.
