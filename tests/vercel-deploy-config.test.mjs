import assert from "node:assert/strict";
import fs from "node:fs";

const vercelConfigPath = new URL("../vercel.json", import.meta.url);
const vercelIgnorePath = new URL("../.vercelignore", import.meta.url);
const recordingsApiPath = new URL("../api/recordings.js", import.meta.url);
const stylesPath = new URL("../styles.css", import.meta.url);

assert.ok(fs.existsSync(vercelConfigPath), "Vercel config exists");
assert.ok(fs.existsSync(vercelIgnorePath), "Vercel ignore file exists");
assert.ok(fs.existsSync(recordingsApiPath), "Vercel recordings API exists");

const vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, "utf8"));
assert.ok(
  vercelConfig.rewrites.some(
    (rewrite) => rewrite.source === "/recordings" && rewrite.destination === "/api/recordings",
  ),
  "Vercel routes /recordings to a serverless API",
);

const vercelIgnore = fs.readFileSync(vercelIgnorePath, "utf8");
assert.match(vercelIgnore, /recordings\/\*\.webm/, "local recording videos are not deployed");
assert.match(vercelIgnore, /recordings\/\*\.mp4/, "local MP4 recording videos are not deployed");
assert.match(vercelIgnore, /tests\//, "tests are not deployed");
assert.match(vercelIgnore, /screenshot-mobile\.png/, "QA screenshots are not deployed");
assert.match(vercelIgnore, /\.vercel-global\//, "temporary CLI config is not deployed");

const styles = fs.readFileSync(stylesPath, "utf8");
assert.match(styles, /--app-vh:\s*100vh/, "layout defines a viewport-height fallback");
assert.match(styles, /100dvh/, "layout uses dynamic viewport height when available");
assert.match(styles, /\.app\s*{[\s\S]*max-width:\s*none/, "app fills the browser width");

const recordingsApi = fs.readFileSync(recordingsApiPath, "utf8");
assert.match(recordingsApi, /req\.method === "GET"/, "API handles recording list requests");
assert.match(recordingsApi, /req\.method === "POST"/, "API handles recording upload requests");
assert.match(recordingsApi, /501/, "API makes cloud storage limitation explicit");

console.log("vercel deploy config passed");
