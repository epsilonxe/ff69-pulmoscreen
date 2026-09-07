// Captures the app screenshot: the single-page app with inputs + result side
// by side and a prediction already shown.
//
// Writes tools/../docs/screenshot.png (this repo). If the sibling
// full_report/figures/ directory exists (i.e. running inside the FF69
// monorepo), the same image is also written there as webapp.png for §4.7.
//
// Prerequisites: the API (port 8000) and the web app (port 3000) must both be
// running, and Google Chrome must be installed. Then:
//   cd tools && npm install && npm run shot
//
// Override Chrome location with CHROME_PATH and the web URL with WEB_URL.
import { existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import puppeteer from "puppeteer-core";

const CHROME =
  process.env.CHROME_PATH ||
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const WEB_URL = process.env.WEB_URL || "http://localhost:3000";
const HERE = path.dirname(fileURLToPath(import.meta.url));

const targets = [];
const docs = path.resolve(HERE, "../docs");
mkdirSync(docs, { recursive: true });
targets.push(path.join(docs, "screenshot.png"));
const reportFigures = path.resolve(HERE, "../../full_report/figures");
if (existsSync(reportFigures)) {
  targets.push(path.join(reportFigures, "webapp.png"));
}

const SYMPTOMS_ON = [
  "การสูบบุหรี่", "นิ้วเหลือง", "ความวิตกกังวล", "โรคเรื้อรัง",
  "ความเหนื่อยล้า", "การแพ้", "หายใจมีเสียง", "การดื่มแอลกอฮอล์",
  "การไอ", "กลืนลำบาก", "เจ็บหน้าอก",
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--force-color-profile=srgb"],
});
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1180, height: 800, deviceScaleFactor: 2 });
  await page.goto(WEB_URL, { waitUntil: "domcontentloaded" });
  // wait for React to hydrate before interacting
  await page.waitForSelector('button[role="switch"]');
  await sleep(800);

  // fill the form (age + a set of symptoms)
  await page.click("#age", { clickCount: 3 });
  await page.type("#age", "68");
  await page.evaluate((labels) => {
    for (const b of document.querySelectorAll('button[role="switch"]')) {
      if (
        labels.some((l) => b.textContent.includes(l)) &&
        b.getAttribute("aria-checked") === "false"
      ) {
        b.click();
      }
    }
  }, SYMPTOMS_ON);

  // wait for the debounced auto-prediction to render the verdict
  await page.waitForFunction(
    () => /พบความเสี่ยง/.test(document.querySelector("aside")?.textContent ?? ""),
    { timeout: 8000 },
  );
  await sleep(500);

  const main = await page.$("main");
  for (const target of targets) {
    await main.screenshot({ path: target });
    console.log(`saved -> ${target}`);
  }
} finally {
  await browser.close();
}
