# Reelroom — direct video links

Mobile-first movie catalogue with search, genre filters, HTML5 video playback, and resume progress. It does **not** upload, proxy, or store video files and does **not** use Cloudflare R2.

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

Use only direct, browser-playable HTTP(S) video URLs you own or are authorized to distribute. The `url` should return video bytes, not an HTML landing page. MP4 with H.264 video and AAC audio is the broadest compatibility target; WebM is also supported in many browsers. Hosting must allow cross-origin requests when needed and support byte-range requests for seeking.

## Add links in the app

The “Add video URL” panel saves links in the current browser's local storage. They are not automatically shared with other visitors or synced across devices. Use **Export links** and **Import JSON** to move your personal list between devices. For a shared, editable public catalogue, connect a database or maintain `data/movies.json` in GitHub and redeploy.

## TeraBox note

A normal TeraBox share link is generally an HTML share page, not a direct video file URL. Paste only a genuine direct video URL that is accessible to the browser and permitted by the source. Some TeraBox URLs may be temporary, require cookies or authorization, block cross-origin playback, or not support seeking; this app cannot bypass those restrictions. If a link fails, the URL provider must offer a browser-playable direct stream.

## Privacy and progress

Resume progress is stored locally in the viewer's browser, not on a server. There are no API keys, storage credentials, uploads, or R2 dependencies in this project.

## Deployment

Import this repository into Vercel and deploy as a standard Next.js app. No environment variables or external database are required for the local-link version. Public catalogue entries live in `data/movies.json` and are shipped with the build.
