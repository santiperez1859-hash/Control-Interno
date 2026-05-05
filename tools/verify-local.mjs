import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bundledModules =
  process.env.CODEX_NODE_MODULES ||
  "C:\\Users\\LA CATALANA\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\node\\node_modules";
const require = createRequire(path.join(bundledModules, "noop.js"));
const { chromium } = require("playwright");

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webmanifest": "application/manifest+json",
};

const server = http.createServer((request, response) => {
  const url = new URL(request.url, "http://127.0.0.1:4181");
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === "/") pathname = "/index.html";
  const candidate = path.normalize(path.join(root, pathname));
  const filePath = candidate.startsWith(root) && fs.existsSync(candidate) && fs.statSync(candidate).isFile()
    ? candidate
    : path.join(root, "index.html");
  response.writeHead(200, { "Content-Type": mime[path.extname(filePath)] || "application/octet-stream" });
  fs.createReadStream(filePath).pipe(response);
});

await new Promise((resolve) => server.listen(4181, "127.0.0.1", resolve));
const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const executablePath = fs.existsSync(chromePath) ? chromePath : fs.existsSync(edgePath) ? edgePath : undefined;
const browser = await chromium.launch({ headless: true, executablePath });
const screenshots = path.join(root, "screenshots");
fs.mkdirSync(screenshots, { recursive: true });

try {
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  await desktop.goto("http://127.0.0.1:4181/", { waitUntil: "networkidle" });
  await desktop.waitForTimeout(500);
  const desktopPixels = await canvasPixelCount(desktop);
  await desktop.screenshot({ path: path.join(screenshots, "desktop-home.png"), fullPage: true });

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, deviceScaleFactor: 2 });
  await mobile.goto("http://127.0.0.1:4181/pagar", { waitUntil: "networkidle" });
  await mobile.waitForTimeout(500);
  await mobile.screenshot({ path: path.join(screenshots, "mobile-pagar.png"), fullPage: true });

  const admin = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
  await admin.goto("http://127.0.0.1:4181/login", { waitUntil: "networkidle" });
  await admin.click("#demo-admin");
  await admin.waitForSelector("#admin-dashboard");
  await admin.screenshot({ path: path.join(screenshots, "desktop-admin.png"), fullPage: true });

  console.log(JSON.stringify({
    ok: true,
    desktopCanvasPaintedPixels: desktopPixels,
    screenshots: [
      path.join(screenshots, "desktop-home.png"),
      path.join(screenshots, "mobile-pagar.png"),
      path.join(screenshots, "desktop-admin.png"),
    ],
  }, null, 2));
} finally {
  await browser.close();
  server.close();
}

async function canvasPixelCount(page) {
  return page.evaluate(() => {
    const canvas = document.getElementById("tech-orb");
    const ctx = canvas.getContext("2d");
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let count = 0;
    for (let index = 0; index < pixels.length; index += 4) {
      const r = pixels[index];
      const g = pixels[index + 1];
      const b = pixels[index + 2];
      const a = pixels[index + 3];
      if (a > 0 && (r + g + b) > 30) count += 1;
    }
    return count;
  });
}
