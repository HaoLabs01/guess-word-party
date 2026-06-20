import http from "node:http";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const recordingsDir = path.join(root, "recordings");
const port = Number(process.env.PORT || 8787);

const mimeTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".webm", "video/webm"],
]);

function sendJson(response, status, data) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(data));
}

function safeStaticPath(urlPath) {
  const cleanPath = decodeURIComponent(urlPath.split("?")[0]);
  const relativePath = cleanPath === "/" ? "/index.html" : cleanPath;
  const resolvedPath = path.resolve(root, `.${relativePath}`);
  return resolvedPath.startsWith(root) ? resolvedPath : null;
}

async function readBody(request, limitBytes = 250 * 1024 * 1024) {
  const chunks = [];
  let total = 0;

  for await (const chunk of request) {
    total += chunk.length;
    if (total > limitBytes) {
      throw new Error("Recording is too large");
    }
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
}

async function saveRecording(request, response) {
  try {
    await mkdir(recordingsDir, { recursive: true });
    const body = await readBody(request);
    if (!body.length) {
      sendJson(response, 400, { ok: false, error: "empty recording" });
      return;
    }

    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const suffix = Math.random().toString(36).slice(2, 8);
    const fileName = `guess-word-${stamp}-${suffix}.webm`;
    const filePath = path.join(recordingsDir, fileName);
    await writeFile(filePath, body);

    sendJson(response, 201, {
      ok: true,
      path: `recordings/${fileName}`,
      url: `/recordings/${fileName}`,
    });
  } catch (error) {
    sendJson(response, 500, { ok: false, error: error.message });
  }
}

async function listRecordings(response) {
  try {
    await mkdir(recordingsDir, { recursive: true });
    const entries = await readdir(recordingsDir);
    const recordings = [];

    for (const name of entries) {
      if (!name.endsWith(".webm")) continue;

      const filePath = path.join(recordingsDir, name);
      const info = await stat(filePath);
      recordings.push({
        name,
        path: `recordings/${name}`,
        url: `/recordings/${name}`,
        size: info.size,
        createdAt: info.birthtime.toISOString(),
      });
    }

    recordings.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    sendJson(response, 200, { ok: true, recordings });
  } catch (error) {
    sendJson(response, 500, { ok: false, error: error.message, recordings: [] });
  }
}

async function serveStatic(request, response) {
  const filePath = safeStaticPath(request.url || "/");
  if (!filePath) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  try {
    const data = await readFile(filePath);
    response.writeHead(200, {
      "Content-Type": mimeTypes.get(path.extname(filePath)) || "application/octet-stream",
    });
    response.end(data);
  } catch {
    response.writeHead(404);
    response.end("Not found");
  }
}

const server = http.createServer((request, response) => {
  if (request.method === "GET" && request.url === "/recordings") {
    listRecordings(response);
    return;
  }

  if (request.method === "POST" && request.url === "/recordings") {
    saveRecording(request, response);
    return;
  }

  if (request.method === "GET") {
    serveStatic(request, response);
    return;
  }

  response.writeHead(405);
  response.end("Method not allowed");
});

server.listen(port, "127.0.0.1", () => {
  console.log(`猜词派对已启动：http://127.0.0.1:${port}`);
  console.log(`录像会保存到：${recordingsDir}`);
});
