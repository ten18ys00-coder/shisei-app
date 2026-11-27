// 画面の動作確認（お試しモード）
import http from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import puppeteer from 'puppeteer-core';

const root = process.argv[2] ?? 'dist-web';
const outDir = process.argv[3] ?? '/tmp/shots';
const types = { '.html': 'text/html', '.png': 'image/png', '.js': 'text/javascript', '.webmanifest': 'application/manifest+json' };
const server = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  let p = join(root, decodeURIComponent(u.pathname));
  if (u.pathname.endsWith('/')) p = join(p, 'index.html');
  if (!existsSync(p)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': types[extname(p)] ?? 'application/octet-stream' });
  res.end(readFileSync(p));
}).listen(4567);

const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox', '--disable-gpu'] });
const errors = [];
async function page(w, h) {
  const p = await browser.newPage();
  await p.setViewport({ width: w, height: h, deviceScaleFactor: 2, isMobile: w < 600, hasTouch: w < 600 });
  p.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  p.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  return p;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const clickText = async (p, text, sel = 'button') => {
  const ok = await p.evaluate((text, sel) => {
    const el = [...document.querySelectorAll(sel)].find((e) => e.textContent.includes(text));
    if (el) { el.click(); return true; }
    return false;
  }, text, sel);
  if (!ok) errors.push('not found: ' + text);
  await sleep(500);
};

const base = 'http://localhost:4567/';
// 1. 先生側（スマホ）
const m = await page(390, 844);
await m.goto(base + '?demo', { waitUntil: 'networkidle0' });
await sleep(800);
await m.screenshot({ path: `${outDir}/01-list.png` });
await clickText(m, '山田さん');
await sleep(600);
await m.screenshot({ path: `${outDir}/02-record.png`, fullPage: true });
await clickText(m, 'メニュー');
await m.screenshot({ path: `${outDir}/03-menu.png`, fullPage: true });
await clickText(m, 'メニューを直す');
await m.screenshot({ path: `${outDir}/04-edit.png` });
await clickText(m, '運動を選ぶ');
await sleep(600);
await m.screenshot({ path: `${outDir}/05-pick.png` });
await clickText(m, 'ひざ・太もも');
await clickText(m, 'メニューに追加');
await clickText(m, 'メニューに戻る');
await m.screenshot({ path: `${outDir}/06-edited.png`, fullPage: true });
await clickText(m, 'メニューを保存');
await sleep(500);
await clickText(m, '渡す');
await sleep(600);
await m.screenshot({ path: `${outDir}/07-send.png`, fullPage: true });
await clickText(m, '患者さんの画面');
await sleep(900);
await m.screenshot({ path: `${outDir}/08-preview.png` });

// 2. 患者さん側（スマホ・実際の操作）
const token = await m.evaluate(() => JSON.parse(localStorage.getItem('hosaka-selfcare-demo-v1')).patients.find((p) => p.id === 'demo2').token);
const pp = await page(390, 844);
await pp.goto(base + `?demo&p=${token}`, { waitUntil: 'networkidle0' });
await sleep(900);
await pp.screenshot({ path: `${outDir}/10-patient.png` });
await pp.screenshot({ path: `${outDir}/11-patient-full.png`, fullPage: true });
await pp.evaluate(() => [...document.querySelectorAll('button[aria-label="できた"]')][0].click());
await sleep(300);
await clickText(pp, '一緒にやる', 'button');
await sleep(700);
await pp.screenshot({ path: `${outDir}/12-player.png` });
await clickText(pp, '一緒にスタート');
await sleep(4500);
await pp.screenshot({ path: `${outDir}/13-player-run.png` });
await clickText(pp, 'もどる');
await pp.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === '4').click());
await sleep(1200);
const saved = await pp.evaluate(() => document.body.innerText.includes('院に届きました'));
console.log('saved message:', saved);
const log = await pp.evaluate(() => JSON.parse(localStorage.getItem('hosaka-selfcare-demo-v1')).logs.filter((l) => l.patient_id === 'demo2').slice(-1)[0]);
console.log('last log:', JSON.stringify(log));

// 3. 先生側（パソコン）
const d = await page(1280, 860);
await d.goto(base + '?demo', { waitUntil: 'networkidle0' });
await sleep(800);
await d.screenshot({ path: `${outDir}/20-desktop-list.png` });
await clickText(d, '運動ライブラリ');
await sleep(1200);
await d.screenshot({ path: `${outDir}/21-desktop-lib.png` });
await clickText(d, '体側のばし');
await sleep(800);
await d.screenshot({ path: `${outDir}/22-desktop-ex.png` });

// 4. ログイン画面（本番モード）
const l = await page(390, 844);
await l.goto(base, { waitUntil: 'networkidle0' });
await sleep(800);
await l.screenshot({ path: `${outDir}/30-login.png` });

// 5. 印刷
const pr = await page(1000, 1400);
await pr.goto(base + '?demo', { waitUntil: 'networkidle0' });
await sleep(500);
await clickText(pr, '佐藤さん');
await clickText(pr, '渡す');
await pr.evaluate(() => { window.print = () => {}; });
await clickText(pr, '紙で渡す');
await sleep(800);
await pr.emulateMediaType('print');
await pr.pdf({ path: `${outDir}/40-print.pdf`, format: 'A4', printBackground: true });

console.log('errors:', errors.length ? errors.join('\n') : 'none');
await browser.close();
server.close();
