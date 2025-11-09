
# Nyheter i v5
- Billigast-sortering i listan (dropdown).
- Verifierad-block med **foto-upload** + **GPS** och krav **< 100 m** från ställets koordinater.
- `api/venues` returnerar nu `lat,lng` och `api/nearby` enrichar deals med `verified` + `photoUrl` för badges.
- Visuella badges: 📷 på deal-kort med foto, samt "Verifierad"-badge när verified=true.

## Viktigt i Supabase
- Storage: bucket `photos` ska finnas och vara **Public**.
