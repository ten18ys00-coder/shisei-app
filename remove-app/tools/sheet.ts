// 確認用：各運動のキーポーズを並べた画像を作る
// 使い方: npx tsx tools/sheet.ts out.svg [id,id,...]
import { writeFileSync } from 'node:fs';
import { renderKey, renderFrame } from '../src/figure/render';
import { EXERCISES } from '../src/data/exercises';
import { cycleLength } from '../src/figure/model';

const out = process.argv[2] ?? '/tmp/sheet.svg';
const only = process.argv[3]?.split(',');
const list = EXERCISES.filter((e) => !only || only.includes(e.id));
const cellW = 200, cellH = 150, labelH = 18;
const maxKeys = 5;
let body = '';
list.forEach((ex, row) => {
  const n = Math.min(ex.anim.keys.length, maxKeys);
  body += `<text x="6" y="${row * (cellH + labelH) + 14}" font-size="13" font-family="sans-serif" fill="#000">${ex.id}  ${ex.name}</text>`;
  for (let i = 0; i < n; i++) {
    const r = renderKey(ex.anim, i);
    body += `<svg x="${i * cellW}" y="${row * (cellH + labelH) + labelH}" width="${cellW}" height="${cellH}" viewBox="${r.viewBox}"><rect x="-1000" y="-1000" width="3000" height="3000" fill="#fff"/>${r.body}</svg>`;
    body += `<rect x="${i * cellW}" y="${row * (cellH + labelH) + labelH}" width="${cellW}" height="${cellH}" fill="none" stroke="#ddd"/>`;
  }
  // 中間フレーム
  const mid = renderFrame(ex.anim, cycleLength(ex.anim) * 0.5 + 0.3);
  body += `<svg x="${maxKeys * cellW}" y="${row * (cellH + labelH) + labelH}" width="${cellW}" height="${cellH}" viewBox="${mid.viewBox}"><rect x="-1000" y="-1000" width="3000" height="3000" fill="#f6fbf8"/>${mid.body}</svg>`;
});
const W = (maxKeys + 1) * cellW, H = list.length * (cellH + labelH);
writeFileSync(out, `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="100%" height="100%" fill="#fff"/>${body}</svg>`);
console.log('wrote', out, list.length);
