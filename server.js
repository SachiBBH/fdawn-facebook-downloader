const express = require("express");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;
const DOWNLOAD_DIR = path.join(__dirname, "downloads");
fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });

app.use(express.json({ limit: "50kb" }));
app.use(express.static(path.join(__dirname, "public")));

function validFacebookUrl(value) {
  try {
    const u = new URL(value);
    const host = u.hostname.toLowerCase();
    return host === "facebook.com" ||
           host.endsWith(".facebook.com") ||
           host === "fb.watch" ||
           host.endsWith(".fb.watch");
  } catch {
    return false;
  }
}

function runYtDlp(url, quality, output) {
  return new Promise((resolve, reject) => {
    // Public/accessible content only. No cookies or login credentials are used.
    const format = quality === "hd"
      ? "bv*+ba/b"
      : "bv*[height<=720]+ba/b[height<=720]/b";

    const args = [
      "--no-playlist",
      "--no-warnings",
      "--restrict-filenames",
      "-f", format,
      "--merge-output-format", "mp4",
      "-o", output,
      url
    ];

    const proc = spawn(process.env.YTDLP_BIN || "yt-dlp", args);
    let stderr = "";

    proc.stderr.on("data", d => { stderr += d.toString(); });
    proc.on("error", err => reject(new Error(
      "yt-dlp is not installed or could not be started."
    )));
    proc.on("close", code => {
      if (code === 0 && fs.existsSync(output)) resolve();
      else reject(new Error(stderr.slice(-1800) || "Video download failed."));
    });
  });
}

app.post("/api/download", async (req, res) => {
  const { url, quality } = req.body || {};

  if (!validFacebookUrl(url)) {
    return res.status(400).json({ error: "Enter a valid Facebook video URL." });
  }

  const selected = quality === "hd" ? "hd" : "default";
  const id = crypto.randomBytes(12).toString("hex");
  const output = path.join(DOWNLOAD_DIR, `${id}.mp4`);

  try {
    await runYtDlp(url, selected, output);

    res.download(output, `fdawn-${selected}.mp4`, err => {
      fs.rm(output, { force: true }, () => {});
      if (err && !res.headersSent) res.status(500).json({ error: "Could not send the file." });
    });
  } catch (err) {
    fs.rm(output, { force: true }, () => {});
    const message = String(err.message || "");
    const safeMessage = /private|login|sign in|authentication|unavailable/i.test(message)
      ? "This video is private, login-required, or unavailable to the downloader."
      : "Unable to download this video. Make sure the link is public and accessible.";
    res.status(502).json({ error: safeMessage });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => console.log(`FDawn running on port ${PORT}`));