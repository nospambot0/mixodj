# MixoDJ
Database-free autonomous DJ with a persistent Cloudflare R2 MP3 library.

Architecture: permitted source URL -> MP3 ingestion -> R2 -> Library -> Auto DJ -> HTML5 audio.

YouTube is an ingestion source only; it is never the playback engine.

Environment:
- R2_ACCOUNT_ID
- R2_BUCKET_NAME
- R2_ACCESS_KEY_ID
- R2_SECRET_ACCESS_KEY
- R2_PUBLIC_URL (optional, recommended for production)
- COBALT_API_URL (self-hosted Cobalt instance)
- COBALT_API_KEY (optional)

The library manifest is stored as library/manifest.json in R2. Stored audio is under music/.