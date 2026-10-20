// Serves a folder under /repo/ (to copy the GitHub Pages subpath). 404 elsewhere.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, join, extname, sep } from "node:path";

const TYPES = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png",
  ".json": "application/json; charset=utf-8",
};
const PREFIX = "/repo/";
const [dir = ".", port = "4173"] = process.argv.slice(2);
const root = resolve(dir);

createServer(async (req, res) => {
  const send = (code, body, type = "text/plain; charset=utf-8") => { res.writeHead(code, { "Content-Type": type }); res.end(body); };
  try {
    let path = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (!path.startsWith(PREFIX)) return send(404, "Not found");
    if (path.split("/").includes("..")) return send(404, "Not found");
    if (path.endsWith("/")) path += "index.html";
    const file = resolve(join(root, path.slice(PREFIX.length)));
    if (file !== root && !file.startsWith(root + sep)) return send(404, "Not found");
    let s = await stat(file);
    let target = file;
    if (s.isDirectory()) { target = join(file, "index.html"); s = await stat(target); }
    send(200, await readFile(target), TYPES[extname(target)] ?? "application/octet-stream");
  } catch { send(404, "Not found"); }
}).listen(Number(port), "127.0.0.1");
