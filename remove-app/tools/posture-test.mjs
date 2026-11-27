import http from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import puppeteer from 'puppeteer-core';
const root = '/home/claude/shisei-app';
const server = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x'); let p = join(root, u.pathname); if (u.pathname.endsWith('/')) p = join(p, 'index.html');
  if (!existsSync(p)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': extname(p) === '.html' ? 'text/html' : 'application/octet-stream' }); res.end(readFileSync(p));
}).listen(4570);
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox'] });
const p = await b.newPage(); const errs = [];
p.on('pageerror', (e) => errs.push(e.message));
await p.goto('http://localhost:4570/', { waitUntil: 'networkidle2', timeout: 60000 });
await new Promise((r) => setTimeout(r, 1500));
const out = await p.evaluate(() => {
  const rows = [
    { key: 'headFwd', val: 20, dir: '頭が肩より前に出ている', st: 'ng', score: 40, g: 'side' },
    { key: 'trunkFwd', val: 6, dir: '上半身が前に傾いている', st: 'wn', score: 70, g: 'side' },
    { key: 'shoulderTilt', val: -3, dir: '右肩が下がっている', st: 'wn', score: 72, g: 'front' },
    { key: 'pelvisTilt', val: 5, dir: '骨盤の左側が低い', st: 'ng', score: 50, g: 'front' },
    { key: 'twist', val: 9, dir: '骨盤に対して上半身が右向きにねじれている', st: 'ng', score: 55, g: 'rot' },
  ];
  const C = careFrom({ rows });
  const ids = C.ex.map((e) => e.id);
  const bad = rows.filter((r) => r.st !== 'ok');
  const R = remItems(ids, C, (id) => bad.filter((r) => careFrom({ rows: [r] }).ex.some((e) => e.id === id)).map((r) => r.dir));
  // すべての対応先が Re:MOVE に実在するか
  return { ids, R, btnWhenLoggedOut: remBtn('posture'), loginVisible: !!document.querySelector('input[type=password], #code, input[name=code]') };
});
console.log(JSON.stringify(out, null, 1));
console.log('errors:', errs.join(' | ') || 'none');
await b.close(); server.close();
