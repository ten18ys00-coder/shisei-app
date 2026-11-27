// 人型アニメーションの描画（SVG の文字列を作る。画面・印刷・確認用で共通）
import {
  type Anim, type Pt, type Skeleton, W, FLOOR, dir, firstOffset, focusPoint, frameBox, placed, poseAt, mergePose,
} from './model';

export const COLORS = {
  near: '#214d3d',
  torso: '#2b604c',
  far: '#9dbcab',
  outline: '#ffffff',
  floor: '#cfd9d3',
  mat: '#e4ece7',
  prop: '#d8ccb4',
  propDark: '#b9a888',
  focus: '#d6a23e',
  towel: '#c9a45c',
};

const f = (n: number) => (Math.round(n * 10) / 10).toString();
const line = (pts: Pt[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${f(p.x)} ${f(p.y)}`).join('');

function stroke(pts: Pt[], w: number, color: string, outline = true) {
  const d = line(pts);
  const o = outline ? `<path d="${d}" fill="none" stroke="${COLORS.outline}" stroke-width="${f(w + 3)}" stroke-linecap="round" stroke-linejoin="round"/>` : '';
  return `${o}<path d="${d}" fill="none" stroke="${color}" stroke-width="${f(w)}" stroke-linecap="round" stroke-linejoin="round"/>`;
}

function arm(k: Skeleton, side: 1 | 2, color: string) {
  const s = side === 1 ? k.sh1 : k.sh2;
  const e = side === 1 ? k.elbow1 : k.elbow2;
  const w = side === 1 ? k.wrist1 : k.wrist2;
  const h = side === 1 ? k.handEnd1 : k.handEnd2;
  return stroke([s, e], W.upperArm, color) + stroke([e, w], W.foreArm, color) + stroke([w, h], W.hand, color);
}

function leg(k: Skeleton, side: 1 | 2, color: string) {
  const hp = side === 1 ? k.hip1 : k.hip2;
  const kn = side === 1 ? k.knee1 : k.knee2;
  const an = side === 1 ? k.ankle1 : k.ankle2;
  const he = side === 1 ? k.heel1 : k.heel2;
  const ba = side === 1 ? k.ball1 : k.ball2;
  const to = side === 1 ? k.toe1 : k.toe2;
  return stroke([hp, kn], W.thigh, color) + stroke([kn, an], W.shin, color) + stroke([he, an, ba, to], W.foot, color);
}

function head(k: Skeleton, color: string) {
  const c = k.headC;
  let s = `<circle cx="${f(c.x)}" cy="${f(c.y)}" r="${f(k.headR + 1.5)}" fill="${COLORS.outline}"/><circle cx="${f(c.x)}" cy="${f(c.y)}" r="${f(k.headR)}" fill="${color}"/>`;
  if (k.view === 'side') {
    const face = k.ang.tN + 90;
    const eye = { x: c.x + dir(face, 5.6).x + dir(k.ang.tN, 1.5).x, y: c.y + dir(face, 5.6).y + dir(k.ang.tN, 1.5).y };
    s += `<circle cx="${f(eye.x)}" cy="${f(eye.y)}" r="1.7" fill="#ffffff"/>`;
  }
  return s;
}

function torso(k: Skeleton) {
  if (k.view === 'side') {
    let s = stroke([k.pelvis, k.midBack, k.shoulderC], W.torso, COLORS.torso);
    if (k.belly > 0.01) {
      const a = k.ang.tT;
      const c = { x: k.midBack.x + (k.pelvis.x - k.midBack.x) * 0.35, y: k.midBack.y + (k.pelvis.y - k.midBack.y) * 0.35 };
      const out = dir(a + 90, 8 + k.belly * 4);
      s += `<circle cx="${f(c.x + out.x)}" cy="${f(c.y + out.y)}" r="${f(6 + k.belly * 5)}" fill="${COLORS.torso}"/>`;
    }
    s += stroke([k.shoulderC, k.neckTop], W.neck, COLORS.torso, false);
    return s;
  }
  const a = k.ang.tT;
  const hipOut1 = { x: k.hip1.x + dir(a - 90, 4).x, y: k.hip1.y + dir(a - 90, 4).y };
  const hipOut2 = { x: k.hip2.x + dir(a + 90, 4).x, y: k.hip2.y + dir(a + 90, 4).y };
  const w1 = { x: k.midBack.x + dir(a - 90, 9).x, y: k.midBack.y + dir(a - 90, 9).y };
  const w2 = { x: k.midBack.x + dir(a + 90, 9).x, y: k.midBack.y + dir(a + 90, 9).y };
  const u = k.ang.tU;
  const s1 = { x: k.sh1.x + dir(u + 180, 2).x, y: k.sh1.y + dir(u + 180, 2).y };
  const s2 = { x: k.sh2.x + dir(u + 180, 2).x, y: k.sh2.y + dir(u + 180, 2).y };
  const poly = [s1, s2, w2, hipOut2, hipOut1, w1];
  const d = line(poly) + 'Z';
  let s = `<path d="${d}" fill="${COLORS.outline}" stroke="${COLORS.outline}" stroke-width="${W.torsoFront * 2 + 3}" stroke-linejoin="round"/>`;
  s += `<path d="${d}" fill="${COLORS.torso}" stroke="${COLORS.torso}" stroke-width="${W.torsoFront * 2}" stroke-linejoin="round"/>`;
  s += stroke([k.shoulderC, k.neckTop], W.neck, COLORS.torso, false);
  return s;
}

type Fixed = { chair?: { x: number; seatY: number; view: 'side' | 'front' }; matX?: [number, number] };

function propsBack(anim: Anim, fx: Fixed, box: { x: number; y: number; w: number; h: number }) {
  let s = '';
  for (const pr of anim.props ?? []) {
    if (pr.type === 'wall') {
      s += `<rect x="${f(pr.x - 4)}" y="${f(box.y - 5)}" width="8" height="${f(FLOOR - box.y + 5)}" fill="${COLORS.prop}"/>`;
    } else if (pr.type === 'mat' && fx.matX) {
      s += `<rect x="${f(fx.matX[0])}" y="${f(FLOOR - 3)}" width="${f(fx.matX[1] - fx.matX[0])}" height="5" rx="2.5" fill="${COLORS.mat}"/>`;
    } else if ((pr.type === 'step' || pr.type === 'table')) {
      s += `<rect x="${f(pr.x)}" y="${f(FLOOR - pr.h)}" width="${f(pr.w)}" height="${f(pr.h)}" rx="2" fill="${COLORS.prop}"/>`;
    } else if (pr.type === 'chair' && fx.chair) {
      const { x, seatY, view } = fx.chair;
      if (view === 'side') {
        const x0 = x - 15, x1 = x + 24;
        s += `<rect x="${f(x0 - 4)}" y="${f(seatY - 52)}" width="5" height="${f(52)}" rx="2" fill="${COLORS.propDark}"/>`;
        s += `<rect x="${f(x0 - 4)}" y="${f(seatY)}" width="${f(x1 - x0 + 4)}" height="5" rx="2" fill="${COLORS.propDark}"/>`;
        s += `<rect x="${f(x0 - 3)}" y="${f(seatY + 4)}" width="4" height="${f(FLOOR - seatY - 4)}" fill="${COLORS.prop}"/>`;
        s += `<rect x="${f(x1 - 4)}" y="${f(seatY + 4)}" width="4" height="${f(FLOOR - seatY - 4)}" fill="${COLORS.prop}"/>`;
      } else {
        s += `<rect x="${f(x - 26)}" y="${f(seatY)}" width="52" height="5" rx="2" fill="${COLORS.propDark}"/>`;
        s += `<rect x="${f(x - 24)}" y="${f(seatY + 4)}" width="4" height="${f(FLOOR - seatY - 4)}" fill="${COLORS.prop}"/>`;
        s += `<rect x="${f(x + 20)}" y="${f(seatY + 4)}" width="4" height="${f(FLOOR - seatY - 4)}" fill="${COLORS.prop}"/>`;
      }
    }
  }
  return s;
}

function propsAttached(anim: Anim, k: Skeleton, layer: 'under' | 'over') {
  let s = '';
  for (const pr of anim.props ?? []) {
    if (layer === 'under' && pr.type === 'towelRoll') {
      let at: Pt; let r = 7;
      if (pr.at === 'knee1') { at = { x: k.knee1.x, y: k.knee1.y + 9 }; r = 6; }
      else {
        const sp = pr.at === 'upperBack' ? { x: k.midBack.x + (k.shoulderC.x - k.midBack.x) * 0.45, y: k.midBack.y + (k.shoulderC.y - k.midBack.y) * 0.45 } : { x: k.pelvis.x + (k.midBack.x - k.pelvis.x) * 0.6, y: k.pelvis.y + (k.midBack.y - k.pelvis.y) * 0.6 };
        at = { x: sp.x, y: FLOOR - r };
      }
      const sq = 1 - 0.2 * (k.pr ?? 0);
      s += `<ellipse cx="${f(at.x)}" cy="${f(FLOOR - r * sq)}" rx="${f(r * 1.5)}" ry="${f(r * sq)}" fill="${COLORS.prop}" stroke="${COLORS.propDark}" stroke-width="1"/>`;
    }
    if (layer === 'under' && pr.type === 'towelFlat') {
      s += `<rect x="${f(k.heel1.x - 8)}" y="${f(FLOOR - 2)}" width="${f(k.toe1.x - k.heel1.x + 22)}" height="3" rx="1.5" fill="${COLORS.towel}"/>`;
    }
    if (layer === 'over' && pr.type === 'ball') {
      const r0 = pr.r ?? 9;
      const sq = k.pr ?? 0;
      let c: Pt;
      if (pr.at === 'knees') c = k.view === 'front' ? { x: (k.knee1.x + k.knee2.x) / 2, y: (k.knee1.y + k.knee2.y) / 2 } : { x: k.knee1.x, y: k.knee1.y };
      else if (pr.at === 'ankles') c = { x: (k.ankle1.x + k.ankle2.x) / 2, y: (k.ankle1.y + k.ankle2.y) / 2 };
      else c = k.wrist1;
      s += `<ellipse cx="${f(c.x)}" cy="${f(c.y)}" rx="${f(r0 * (1 + 0.12 * sq))}" ry="${f(r0 * (1 - 0.22 * sq))}" fill="#efe3c6" stroke="${COLORS.propDark}" stroke-width="1.4" opacity="0.95"/>`;
    }
    if (layer === 'over' && pr.type === 'towel') {
      const a = (k as unknown as Record<string, Pt>)[pr.from];
      const b = (k as unknown as Record<string, Pt>)[pr.to];
      s += `<path d="${line([a, b])}" stroke="${COLORS.towel}" stroke-width="3.2" stroke-linecap="round" fill="none"/>`;
    }
  }
  return s;
}

export type RenderOpts = { focus?: boolean; mono?: boolean };

export type Rendered = { viewBox: string; body: string; cue?: string; phase: number };

const cache = new WeakMap<Anim, { box: ReturnType<typeof frameBox>; fo: number; fixed: Fixed }>();

function prep(anim: Anim) {
  let c = cache.get(anim);
  if (c) return c;
  const box = frameBox(anim);
  const fo = firstOffset(anim);
  const fixed: Fixed = {};
  const chair = anim.props?.find((p) => p.type === 'chair') as { type: 'chair'; key?: number } | undefined;
  if (chair) {
    const k0 = placed(anim, mergePose(anim.base, anim.keys[chair.key ?? 0].p), fo);
    fixed.chair = { x: k0.pelvis.x, seatY: k0.pelvis.y + (anim.view === 'side' ? 10 : 12), view: anim.view };
  }
  if (anim.props?.some((p) => p.type === 'mat')) fixed.matX = [box.x + 10, box.x + box.w - 10];
  c = { box, fo, fixed };
  cache.set(anim, c);
  return c;
}

export function renderFrame(anim: Anim, time: number, opts: RenderOpts = {}): Rendered {
  const { box, fo, fixed } = prep(anim);
  const { pose, cue, phase } = poseAt(anim, time);
  const k = placed(anim, pose, fo);
  const far = opts.mono ? '#a9a9a9' : COLORS.far;
  const near = opts.mono ? '#333333' : COLORS.near;
  let s = '';
  s += `<line x1="${f(box.x)}" y1="${FLOOR + 1}" x2="${f(box.x + box.w)}" y2="${FLOOR + 1}" stroke="${COLORS.floor}" stroke-width="2"/>`;
  s += propsBack(anim, fixed, box);
  s += propsAttached(anim, k, 'under');
  if (k.view === 'side') {
    s += arm(k, 2, far) + leg(k, 2, far);
    s += torso(k) + head(k, near);
    s += leg(k, 1, near) + arm(k, 1, near);
  } else {
    s += leg(k, 1, near) + leg(k, 2, near);
    s += torso(k) + head(k, near);
    s += arm(k, 1, near) + arm(k, 2, near);
  }
  s += propsAttached(anim, k, 'over');
  if (opts.focus !== false && anim.focus?.length) {
    const pulse = 0.38 + 0.18 * Math.sin(time * 3.2);
    for (const fk of anim.focus) {
      const fp = focusPoint(k, fk);
      s += `<circle cx="${f(fp.p.x)}" cy="${f(fp.p.y)}" r="${f(fp.r)}" fill="${COLORS.focus}" opacity="${f(pulse)}"/>`;
    }
  }
  let vb = `${f(box.x)} ${f(box.y)} ${f(box.w)} ${f(box.h)}`;
  if (anim.mirror) {
    s = `<g transform="scale(-1,1)">${s}</g>`;
    vb = `${f(-(box.x + box.w))} ${f(box.y)} ${f(box.w)} ${f(box.h)}`;
  }
  return { viewBox: vb, body: s, cue, phase };
}

/** 静止画（印刷・一覧用）：指定したキーのポーズ */
export function renderKey(anim: Anim, keyIndex: number, opts: RenderOpts = {}): Rendered {
  let t = 0;
  for (let i = 0; i <= keyIndex && i < anim.keys.length; i++) {
    t += anim.keys[i].d ?? 1;
    if (i < keyIndex) t += anim.keys[i].hold ?? 0;
  }
  return renderFrame(anim, Math.max(0, t - 0.0001), { ...opts, focus: opts.focus ?? true });
}

export function svgString(r: Rendered, width = 320) {
  const [, , w, h] = r.viewBox.split(' ').map(Number);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${r.viewBox}" width="${width}" height="${Math.round((width * h) / w)}">${r.body}</svg>`;
}
