
# Notis: Storage-bucket
För foto-upload behövs en publik bucket i Supabase Storage.

1. Supabase → **Storage** → **Create new bucket** → namn: `photos` → Public: **ON** → Create.
2. Klart. Filvägarna blir `photos/{venueId}/uuid.jpg` och hämtas via public URL.
