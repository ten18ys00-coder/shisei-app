// 日付（日本時間）・ID・回数表示などの小道具
import type { Dose } from '../data/exercises';
import type { PlanItem } from '../types';

export function todayJST(d = new Date()): string {
  const j = new Date(d.getTime() + 9 * 3600 * 1000);
  return j.toISOString().slice(0, 10);
}
export function addDays(day: string, n: number): string {
  const d = new Date(day + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
export function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b + 'T00:00:00Z').getTime() - new Date(a + 'T00:00:00Z').getTime()) / 86400000);
}
const WD = ['日', '月', '火', '水', '木', '金', '土'];
export function weekday(day: string) {
  return WD[new Date(day + 'T00:00:00Z').getUTCDay()];
}
export function mdLabel(day: string) {
  const [, m, d] = day.split('-').map(Number);
  return `${m}/${d}`;
}

export function rid(n = 10): string {
  const a = 'abcdefghijkmnpqrstuvwxyz23456789';
  const b = new Uint8Array(n);
  crypto.getRandomValues(b);
  return Array.from(b, (x) => a[x % a.length]).join('');
}
export function newToken(): string {
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
}

/** 回数の表示（例：10回 × 2セット・左右・1日2回） */
export function doseText(d: Dose | PlanItem, opts: { perDay?: boolean } = {}): string {
  const parts: string[] = [];
  if (d.reps) parts.push(`${d.reps}回`);
  if (d.hold) parts.push(d.reps ? `${d.hold}秒キープ` : `${d.hold}秒`);
  if (d.seconds) parts.push(d.seconds >= 60 && d.seconds % 60 === 0 ? `${d.seconds / 60}分` : `${d.seconds}秒`);
  let s = parts.join('・');
  if (d.sets && d.sets > 1) s += ` × ${d.sets}セット`;
  if (d.sides) s += '（左右）';
  if (opts.perDay !== false && d.perDay) s += `　1日${d.perDay}回`;
  return s || '先生の指示どおり';
}

export const storage = {
  get(key: string): string | null {
    try { return localStorage.getItem(key); } catch { return mem.get(key) ?? null; }
  },
  set(key: string, v: string) {
    try { localStorage.setItem(key, v); } catch { mem.set(key, v); }
  },
  del(key: string) {
    try { localStorage.removeItem(key); } catch { mem.delete(key); }
  },
};
const mem = new Map<string, string>();

export function youtubeId(url?: string): string | null {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/))([\w-]{11})/);
  return m ? m[1] : null;
}

export function classNames(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(' ');
}
