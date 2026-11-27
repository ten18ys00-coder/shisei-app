// 院の運動ライブラリ：標準の運動＋院で追加した運動＋動画の差し込み
import { EXERCISES, EX_BY_ID, type Exercise } from '../data/exercises';
import type { LibData, LibEntry } from '../types';

export type Lib = { all: Exercise[]; byId: Record<string, Exercise> };

const NO_ANIM: Exercise['anim'] = { view: 'side', keys: [{ p: {} }] };

export function customToExercise(id: string, d: LibData): Exercise | null {
  const c = d.custom;
  if (!c) return null;
  const from = c.animFrom ? EX_BY_ID[c.animFrom] : undefined;
  return {
    id, name: c.name || '（名前なし）', areas: c.areas ?? [], purpose: c.purpose ?? [], position: c.position ?? 'stand', level: c.level ?? 1,
    dose: c.dose ?? {}, target: c.target ?? '', steps: c.steps ?? [], points: c.points ?? [], caution: c.caution,
    anim: from?.anim ?? NO_ANIM, custom: true, video: d.video,
  };
}

export function buildLib(entries: Record<string, LibData>): Lib {
  const all: Exercise[] = [];
  for (const ex of EXERCISES) {
    const o = entries[ex.id];
    all.push(o?.video ? { ...ex, video: o.video } : ex);
  }
  for (const [id, d] of Object.entries(entries)) {
    if (EX_BY_ID[id]) continue;
    const ex = customToExercise(id, d);
    if (ex) all.push(ex);
  }
  return { all, byId: Object.fromEntries(all.map((e) => [e.id, e])) };
}

export function libFromEntries(list: LibEntry[]): Lib {
  return buildLib(Object.fromEntries(list.map((e) => [e.id, e.data])));
}

export function hasAnim(ex: Exercise) {
  return ex.anim.keys.length > 1;
}
