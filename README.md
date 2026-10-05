# MixoDJ

Autonomous digital DJ web app.

Current build includes selectable crowd states, autonomous demo track scoring, dynamic queue, admin skip, and an authorized-source ingestion UI.

Run locally with npm install, then npm run dev.

Production ingestion should use an authorized/licensed audio worker and private S3-compatible object storage. Do not expose storage credentials or process audio without the required rights.
