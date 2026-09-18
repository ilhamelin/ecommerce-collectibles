import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const TARGET_URL = "https://ecommerce-collectibles.vercel.app";
const SCREENSHOT_PATH = "C:\\Users\\benja\\.gemini\\antigravity-ide\\brain\\e1d49381-fcfd-4275-b2db-033895dfa4dc\\storefront_chrome_audit.png";
const PORT = 9222;

const tempProfileDir = fs.mkdtempSync(path.join(os.tmpdir(), "chrome-audit-"));

console.log("[1/5] Lanzando Google Chrome Headless...");
const chrome = spawn(CHROME_PATH, [
  "--headless=new",
  `--remote-debugging-port=${PORT}`,
  "--disable-gpu",
  "--no-first-run",
  "--no-default-browser-check",
  `--user-data-dir=${tempProfileDir}`,
  "--window-size=1280,800",
  "about:blank",
], { stdio: "ignore" });

chrome.on("error", (err) => {
  console.error("Error al iniciar Chrome:", err);
  process.exit(1);
});

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForCdp() {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      if (res.ok) return await res.json();
    } catch {}
    await sleep(200);
  }
  throw new Error("No se pudo conectar a CDP en el puerto " + PORT);
}

async function run() {
  try {
    await waitForCdp();
    console.log("[2/5] Creando target tab en Chrome...");
    const tabRes = await fetch(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent(TARGET_URL)}`, { method: "PUT" });
    const tab = await tabRes.json();
    const wsUrl = tab.webSocketDebuggerUrl;

    console.log("[3/5] Conectando via WebSocket a CDP...");
    const ws = new WebSocket(wsUrl);

    const consoleLogs = [];
    const networkErrors = [];
    let domContentLoaded = false;
    let loadFired = false;

    let idSeq = 1;
    const pending = new Map();

    function send(method, params = {}) {
      const id = idSeq++;
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && pending.has(msg.id)) {
        const { resolve } = pending.get(msg.id);
        pending.delete(msg.id);
        resolve(msg.result);
      } else if (msg.method) {
        if (msg.method === "Page.domContentEventFired") {
          domContentLoaded = true;
        }
        if (msg.method === "Page.loadEventFired") {
          loadFired = true;
        }
        if (msg.method === "Runtime.consoleAPICalled") {
          const text = msg.params.args.map(a => a.value || a.description || "").join(" ");
          consoleLogs.push({ type: msg.params.type, text, timestamp: msg.params.timestamp });
        }
        if (msg.method === "Runtime.exceptionThrown") {
          const desc = msg.params.exceptionDetails?.exception?.description || msg.params.exceptionDetails?.text;
          consoleLogs.push({ type: "error", text: desc, isException: true });
        }
        if (msg.method === "Network.responseReceived") {
          const { status, url, statusText } = msg.params.response;
          if (status >= 400) {
            networkErrors.push({ status, url, statusText });
          }
        }
        if (msg.method === "Network.loadingFailed") {
          networkErrors.push({
            status: "FAILED",
            url: msg.params.errorText,
            requestId: msg.params.requestId,
            type: msg.params.type,
            canceled: msg.params.canceled
          });
        }
      }
    };

    await send("Page.enable");
    await send("Network.enable");
    await send("Runtime.enable");

    console.log("[4/5] Esperando carga completa y ciclo de hidratación React...");
    await sleep(4000);

    // Evaluar estado del DOM y elementos clave
    const domCheck = await send("Runtime.evaluate", {
      expression: `(() => {
        const nav = document.querySelector('nav');
        const hero = document.querySelector('section[aria-label*="Carrusel"]');
        const productGrid = document.querySelector('.grid');
        const titles = Array.from(document.querySelectorAll('h1, h2, h3')).map(h => h.innerText.trim()).filter(Boolean);
        const images = Array.from(document.querySelectorAll('img')).map(img => ({
          src: img.src,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          complete: img.complete
        }));
        return {
          title: document.title,
          hasNavbar: !!nav,
          hasHero: !!hero,
          productGridPresent: !!productGrid,
          headingCount: titles.length,
          headingsSample: titles.slice(0, 5),
          totalImages: images.length,
          brokenImages: images.filter(i => i.complete && i.naturalWidth === 0).length
        };
      })()`,
      returnByValue: true
    });

    console.log("[5/5] Capturando captura de pantalla viewport...");
    const screenshot = await send("Page.captureScreenshot", { format: "png" });
    const buffer = Buffer.from(screenshot.data, "base64");
    fs.writeFileSync(SCREENSHOT_PATH, buffer);
    console.log(`Captura guardada en: ${SCREENSHOT_PATH}`);

    await send("Browser.close").catch(() => {});
    ws.close();

    const report = {
      domContentLoaded,
      loadFired,
      domState: domCheck?.result?.value,
      consoleLogsCount: consoleLogs.length,
      consoleErrorsCount: consoleLogs.filter(l => l.type === "error").length,
      consoleLogs,
      networkErrorsCount: networkErrors.length,
      networkErrors,
      screenshotFile: SCREENSHOT_PATH
    };

    console.log("===AUDIT_RESULT_START===");
    console.log(JSON.stringify(report, null, 2));
    console.log("===AUDIT_RESULT_END===");
  } finally {
    try {
      chrome.kill();
      fs.rmSync(tempProfileDir, { recursive: true, force: true });
    } catch {}
  }
}

run().catch((e) => {
  console.error("Fallo general en la auditoría:", e);
  try {
    chrome.kill();
    fs.rmSync(tempProfileDir, { recursive: true, force: true });
  } catch {}
  process.exit(1);
});
