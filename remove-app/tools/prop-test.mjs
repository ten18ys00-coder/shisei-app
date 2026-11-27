import http from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import puppeteer from 'puppeteer-core';
const root = 'docs';
const server = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x'); let p = join(root, u.pathname); if (u.pathname.endsWith('/')) p = join(p, 'index.html');
  if (!existsSync(p)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': extname(p) === '.html' ? 'text/html' : 'application/octet-stream' }); res.end(readFileSync(p));
}).listen(4571);
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox'] });
const p = await b.newPage(); const errs = [];
p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const click = async (t) => { const ok = await p.evaluate((t) => { const el = [...document.querySelectorAll('button')].find((e) => e.textContent.includes(t)); if (el) { el.click(); return true } return false }, t); if (!ok) errs.push('not found: ' + t); await sleep(600); };
// 姿勢アプリから来た想定：#p=demo1
await p.goto('http://localhost:4571/?demo#p=demo1', { waitUntil: 'networkidle0' });
await sleep(1200);
await p.screenshot({ path: '/tmp/shots/p1-proposal.png' });
await click('メニューに入れる');
await p.screenshot({ path: '/tmp/shots/p2-added.png', fullPage: true });
await click('メニューを保存');
await sleep(500);
const after = await p.evaluate(() => { const db = JSON.parse(localStorage.getItem('hosaka-selfcare-demo-v2')); const x = db.patients.find((q) => q.id === 'demo1'); return { proposal: x.proposal, items: x.plan.items.map((i) => i.exId + (i.note ? '(' + i.note + ')' : '')), title: x.plan.title }; });
console.log(JSON.stringify(after));
await click('記録');
await sleep(500);
await p.evaluate(() => window.scrollTo(0, 1200));
await sleep(300);
await p.screenshot({ path: '/tmp/shots/p3-posture.png' });
console.log('errors:', errs.join(' | ') || 'none');
await b.close(); server.close();
