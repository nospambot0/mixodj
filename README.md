# Reelroom — direct video links

Mobile-first movie catalogue with search, genre filters, HTML5 video playback, HLS streaming for TeraBox share links, and resume progress. It does **not** upload or store video files and does **not** use Cloudflare R2.

## Run locally

```bash
npm install
npm run dev
``

## Add public movie links

Edit `data/movies.json` and redeploy. Example:

```json
[
  {
    "id": "sample-film-01",
    "title": "Sample Film",
    "url": "https://cdn.example.com/path/video.mp4",
    "year": "2025",
    "genre": "Drama",
    "description": "Optional synopsis",
    "poster": "https://cdn.example.com/path/poster.jpg"
  }
]
``

Use only video links you own or are authorized to access and distribute. Direct URLs should return video bytes. MP4 with H.264 video and AAC audio is broadly compatible.

## Add links in the app

The “Add video URL” panel saves links in the current browser's local storage. They are not automatically shared with other visitors or synced across devices. Use **Export links** and **Import JSON** to move your personal list between devices. For a shared, editable public catalogue, connect a database or maintain `data/movies.json` in GitHub and redeploy.

## TeraBox note

A TeraBox share URL can be added directly. Reelroom first calls the documented `mode=resolve` endpoint, then plays the `mode=stream` HLS playlist using Hls.js (or native HLS where supported). It uses the public worker endpoint documented by [saahiyo/terabox-gateway](https://github.com/saahiyo/terabox-gateway). That shared service can be rate-limited or unavailable; private, expired, password-protected, or unsupported shares may still fail. Use only content you are authorized to access.

## Privacy and progress

Resume progress is stored locally in the viewer's browser, not on a server. There are no API keys, storage credentials, uploads, or R2 dependencies in this project.

## Deployment

Import this repository into Vercel and deploy as a standard Next.js app. No environment variables or external database are required for the local-link version. Public catalogue entries live in `data/movies.json` and are shipped with the build.
