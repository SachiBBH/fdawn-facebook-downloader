# FDawn v2 — Facebook Video Downloader

This version includes a real server-side downloader using `yt-dlp` and FFmpeg.

## Local run (Node + yt-dlp required)

Install:
- Node.js 18+
- Python 3
- FFmpeg
- yt-dlp (`pip install -U yt-dlp`)

Then:

```bash
npm install
npm start
```

Open http://localhost:3000

## Docker

Docker is the easiest deployment option because the Dockerfile installs FFmpeg and yt-dlp automatically:

```bash
docker build -t fdawn .
docker run -p 3000:3000 fdawn
```

## How it works

The frontend sends the Facebook URL and selected quality to `/api/download`.
The server calls yt-dlp without cookies or login credentials and streams the resulting MP4 back to the browser.

HD uses the best available video/audio combination.
Default targets up to 720p when that format is available.

Only use this with public/accessible videos that you have permission to download and in accordance with Facebook's terms and applicable law.
Private/login-required videos are not bypassed.
