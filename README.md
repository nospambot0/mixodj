# MixoDJ

Database-free autonomous DJ prototype.

## Current architecture

- Next.js App Router
- Server-side in-memory DJ state
- One consolidated /api/dj endpoint
- YouTube IFrame playback
- Queue controls
- 24-hour in-memory repeat history
- No database

## Controls

- Start/stop Auto DJ
- Add a YouTube URL to the queue
- Play Now
- Skip
- Clear queue
- Automatic next-track handling when YouTube reports playback ended

## Limitation

In-memory state can be lost when a serverless instance restarts or traffic moves between instances. Durable realtime state can be added later without introducing a traditional database.
