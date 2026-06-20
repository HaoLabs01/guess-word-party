import assert from "node:assert/strict";
import fs from "node:fs";

const vercelConfigPath = new URL("../vercel.json", import.meta.url);
const vercelIgnorePath = new URL("../.vercelignore", import.meta.url);
const recordingsApiPath = new URL("../api/recordings.js", import.meta.url);

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
assert.match(vercelIgnore, /tests\//, "tests are not deployed");
assert.match(vercelIgnore, /screenshot-mobile\.png/, "QA screenshots are not deployed");
assert.match(vercelIgnore, /\.vercel-global\//, "temporary CLI config is not deployed");

const recordingsApi = fs.readFileSync(recordingsApiPath, "utf8");
assert.match(recordingsApi, /req\.method === "GET"/, "API handles recording list requests");
assert.match(recordingsApi, /req\.method === "POST"/, "API handles recording upload requests");
assert.match(recordingsApi, /501/, "API makes cloud storage limitation explicit");

console.log("vercel deploy config passed");
