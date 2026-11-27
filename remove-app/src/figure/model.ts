// 人型アニメーションの骨格モデル（オリジナル）
// 角度は度。方向 θ は「0＝上、90＝右（正面方向）、180＝下、270＝左」。
// 横向き（side）：人は画面の右を向く。1＝手前の手足、2＝奥の手足。
// 正面（front）：人はこちらを向く。1＝画面の左側（本人の右）、2＝画面の右側（本人の左）。

export type View = 'side' | 'front';

export type Pose = {
  t: number; // 胴体（骨盤→みぞおち）の向き
  c: number; // 胸の曲げ（＋で丸める・前に倒す）
  n: number; // 首（＋で前に倒す・うつむく）
  hd: number; // 頭（＋であごを引く方向）
  sh: number; // 肩のすくめ（上に持ち上げる量）
  s1: number; e1: number; w1: number; // 肩（＋で前・上へ。正面では外へ）・ひじ・手首
  s2: number; e2: number; w2: number;
  h1: number; k1: number; a1: number; f1: number; // 股関節（＋で前へ。正面では外へ）・ひざ・足首（＋でつま先を伸ばす）・足指
  h2: number; k2: number; a2: number; f2: number;
  sl1: number; sl2: number; // すねの見かけの長さ（奥行き方向へ向くときに縮める。1＝通常）
  tl1: number; tl2: number; // ももの見かけの長さ
  belly: number; // おなかのふくらみ（0〜1）
  pr: number; // 道具をつぶす量（0〜1）
};

export const BASE: Pose = {
  t: 0, c: 0, n: 0, hd: 0, sh: 0,
  s1: 4, e1: 8, w1: 0, s2: 4, e2: 8, w2: 0,
  h1: 0, k1: 0, a1: 0, f1: 0, h2: 0, k2: 0, a2: 0, f2: 0,
  sl1: 1, sl2: 1, tl1: 1, tl2: 1, belly: 0, pr: 0,
};

export const L = {
  pelvisToMid: 25, midToShoulder: 27, neck: 9, head: 11,
  upperArm: 30, foreArm: 24, hand: 8,
  thigh: 43, shin: 41, footBall: 15, toe: 6, heel: 6,
  shoulderW: 16, hipW: 9,
};

export const W = { torso: 22, torsoFront: 6, upperArm: 9, foreArm: 8, hand: 6.5, thigh: 12.5, shin: 10, foot: 6.5, neck: 9 };

export type Pt = { x: number; y: number };
const rad = (d: number) => (d * Math.PI) / 180;
export const dir = (deg: number, len = 1): Pt => ({ x: Math.sin(rad(deg)) * len, y: -Math.cos(rad(deg)) * len });
const add = (a: Pt, b: Pt): Pt => ({ x: a.x + b.x, y: a.y + b.y });
const mid = (a: Pt, b: Pt, k = 0.5): Pt => ({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k });

export type Limb = { pts: Pt[]; widths: number[] };
export type Skeleton = {
  view: View;
  pelvis: Pt; midBack: Pt; shoulderC: Pt; neckTop: Pt; headC: Pt; headDeg: number; headR: number;
  sh1: Pt; sh2: Pt; hip1: Pt; hip2: Pt;
  elbow1: Pt; wrist1: Pt; handEnd1: Pt; elbow2: Pt; wrist2: Pt; handEnd2: Pt;
  knee1: Pt; ankle1: Pt; heel1: Pt; ball1: Pt; toe1: Pt;
  knee2: Pt; ankle2: Pt; heel2: Pt; ball2: Pt; toe2: Pt;
  ang: Record<string, number>;
  belly: number;
  pr: number;
};

/** 角度から各関節の位置を計算（骨盤を原点） */
export function solve(p: Pose, view: View): Skeleton {
  const pelvis = { x: 0, y: 0 };
  const tT = p.t;
  const tU = p.t + p.c;
  const midBack = add(pelvis, dir(tT, L.pelvisToMid));
  const shoulderC0 = add(midBack, dir(tU, L.midToShoulder));
  const shoulderC = add(shoulderC0, dir(tU, p.sh));
  const tN = tU + p.n;
  const neckTop = add(shoulderC0, dir(tN, L.neck + p.sh * 0.2));
  const tH = tN + p.hd;
  const headC = add(neckTop, dir(tN, L.head * 0.85));

  let sh1: Pt, sh2: Pt, hip1: Pt, hip2: Pt;
  let tUA1: number, tFA1: number, tUA2: number, tFA2: number;
  let tTH1: number, tSH1: number, tTH2: number, tSH2: number;
  if (view === 'side') {
    sh1 = shoulderC; sh2 = add(shoulderC, dir(tU - 90, 1.5));
    hip1 = pelvis; hip2 = add(pelvis, dir(tT - 90, 1));
    tUA1 = tU + 180 - p.s1; tFA1 = tUA1 - p.e1;
    tUA2 = tU + 180 - p.s2; tFA2 = tUA2 - p.e2;
    tTH1 = tT + 180 - p.h1; tSH1 = tTH1 + p.k1;
    tTH2 = tT + 180 - p.h2; tSH2 = tTH2 + p.k2;
  } else {
    sh1 = add(shoulderC, dir(tU - 90, L.shoulderW)); sh2 = add(shoulderC, dir(tU + 90, L.shoulderW));
    hip1 = add(pelvis, dir(tT - 90, L.hipW)); hip2 = add(pelvis, dir(tT + 90, L.hipW));
    tUA1 = tU + 180 + p.s1; tFA1 = tUA1 - p.e1;
    tUA2 = tU + 180 - p.s2; tFA2 = tUA2 + p.e2;
    tTH1 = tT + 180 + p.h1; tSH1 = tTH1 - p.k1;
    tTH2 = tT + 180 - p.h2; tSH2 = tTH2 + p.k2;
  }
  const elbow1 = add(sh1, dir(tUA1, L.upperArm));
  const wrist1 = add(elbow1, dir(tFA1, L.foreArm));
  const handEnd1 = add(wrist1, dir(tFA1 - (view === 'side' ? p.w1 : -p.w1), L.hand));
  const elbow2 = add(sh2, dir(tUA2, L.upperArm));
  const wrist2 = add(elbow2, dir(tFA2, L.foreArm));
  const handEnd2 = add(wrist2, dir(tFA2 - (view === 'side' ? p.w2 : p.w2), L.hand));

  const knee1 = add(hip1, dir(tTH1, L.thigh * p.tl1));
  const ankle1 = add(knee1, dir(tSH1, L.shin * p.sl1));
  const knee2 = add(hip2, dir(tTH2, L.thigh * p.tl2));
  const ankle2 = add(knee2, dir(tSH2, L.shin * p.sl2));

  const foot = (ankle: Pt, tSH: number, a: number, f: number, side: 1 | 2) => {
    if (view === 'side') {
      const tFT = tSH - 90 + a;
      const ball = add(ankle, dir(tFT + 16, L.footBall));
      const heel = add(ankle, dir(tFT + 150, L.heel));
      const toe = add(ball, dir(tFT + f, L.toe));
      return { heel, ball, toe };
    }
    // 正面：足先はこちら向き。外側へ少し開いた短い形で描く
    const out = side === 1 ? -1 : 1;
    const heel = add(ankle, dir(tSH, 3));
    const ball = add(heel, dir(tSH + out * 70, 7));
    const toe = add(ball, dir(tSH + out * 70, 2));
    return { heel, ball, toe };
  };
  const f1 = foot(ankle1, tSH1, p.a1, p.f1, 1);
  const f2 = foot(ankle2, tSH2, p.a2, p.f2, 2);

  return {
    view, pelvis, midBack, shoulderC, neckTop, headC, headDeg: tH, headR: L.head,
    sh1, sh2, hip1, hip2,
    elbow1, wrist1, handEnd1, elbow2, wrist2, handEnd2,
    knee1, ankle1, heel1: f1.heel, ball1: f1.ball, toe1: f1.toe,
    knee2, ankle2, heel2: f2.heel, ball2: f2.ball, toe2: f2.toe,
    ang: { tT, tU, tN, tH, tUA1, tFA1, tUA2, tFA2, tTH1, tSH1, tTH2, tSH2 },
    belly: p.belly, pr: p.pr,
  };
}

/** 床との接地の計算に使う点（太さ込み） */
export function contactPoints(k: Skeleton): { p: Pt; r: number }[] {
  const pts: { p: Pt; r: number }[] = [
    { p: k.headC, r: k.headR },
    { p: k.pelvis, r: k.view === 'side' ? W.torso / 2 : W.torsoFront },
    { p: k.midBack, r: k.view === 'side' ? W.torso / 2 : W.torsoFront },
    { p: k.shoulderC, r: k.view === 'side' ? W.torso / 2 - 1 : W.torsoFront },
    { p: k.sh1, r: W.upperArm / 2 }, { p: k.sh2, r: W.upperArm / 2 },
    { p: k.elbow1, r: W.upperArm / 2 }, { p: k.elbow2, r: W.upperArm / 2 },
    { p: k.wrist1, r: W.foreArm / 2 }, { p: k.wrist2, r: W.foreArm / 2 },
    { p: k.handEnd1, r: W.hand / 2 }, { p: k.handEnd2, r: W.hand / 2 },
    { p: k.knee1, r: W.thigh / 2 - 1 }, { p: k.knee2, r: W.thigh / 2 - 1 },
    { p: k.ankle1, r: W.shin / 2 }, { p: k.ankle2, r: W.shin / 2 },
    { p: k.heel1, r: W.foot / 2 }, { p: k.ball1, r: W.foot / 2 }, { p: k.toe1, r: W.foot / 2 - 0.5 },
    { p: k.heel2, r: W.foot / 2 }, { p: k.ball2, r: W.foot / 2 }, { p: k.toe2, r: W.foot / 2 - 0.5 },
  ];
  return pts;
}

export function translate(k: Skeleton, dx: number, dy: number): Skeleton {
  const out: Record<string, unknown> = { ...k };
  for (const [key, v] of Object.entries(k)) {
    if (v && typeof v === 'object' && 'x' in (v as object) && 'y' in (v as object)) {
      const q = v as Pt;
      out[key] = { x: q.x + dx, y: q.y + dy };
    }
  }
  return out as Skeleton;
}

export type FocusKey =
  | 'neck' | 'neckSide' | 'upperBack' | 'lowBack' | 'abdomen' | 'chest' | 'side' | 'glute' | 'hipFront1' | 'hipSide'
  | 'quad1' | 'hamstring1' | 'innerThigh' | 'calf1' | 'shinFront1' | 'shoulder1' | 'shoulderBlade' | 'forearm1'
  | 'ankle1' | 'sole1' | 'knee1' | 'quad2' | 'hamstring2' | 'calf2' | 'hipFront2' | 'glute2' | 'wholeBack' | 'trap1' | 'trap2' | 'upperArm1';

/** 「ここが伸びる・効く」を示す位置 */
export function focusPoint(k: Skeleton, f: FocusKey): { p: Pt; r: number } {
  const a = k.ang;
  const side = k.view === 'side';
  switch (f) {
    case 'neck': return { p: add(mid(k.shoulderC, k.neckTop, 0.6), dir(a.tN - 90, side ? 4 : 0)), r: 9 };
    case 'neckSide': return { p: add(mid(k.shoulderC, k.neckTop, 0.5), dir(a.tN + 90, 5)), r: 9 };
    case 'upperBack': return { p: add(mid(k.midBack, k.shoulderC, 0.55), dir(a.tU - 90, side ? 7 : 0)), r: 12 };
    case 'shoulderBlade': return { p: add(mid(k.midBack, k.shoulderC, 0.75), dir(a.tU - 90, side ? 8 : 8)), r: 11 };
    case 'lowBack': return { p: add(mid(k.pelvis, k.midBack, 0.6), dir(a.tT - 90, side ? 7 : 0)), r: 12 };
    case 'wholeBack': return { p: add(k.midBack, dir(a.tT - 90, side ? 8 : 0)), r: 20 };
    case 'abdomen': return { p: add(mid(k.pelvis, k.midBack, 0.7), dir(a.tT + 90, side ? 7 : 0)), r: 12 };
    case 'chest': return { p: add(mid(k.midBack, k.shoulderC, 0.65), dir(a.tU + 90, side ? 7 : 0)), r: 12 };
    case 'side': return { p: add(k.midBack, dir(a.tT + 90, 11)), r: 12 };
    case 'glute': return { p: add(k.pelvis, add(dir(a.tT - 90, side ? 8 : 0), dir(a.tT + 180, 4))), r: 12 };
    case 'glute2': return { p: add(k.hip2, dir(a.tT - 90, side ? 8 : 4)), r: 11 };
    case 'hipSide': return { p: add(k.hip2, dir(a.tT + 90, 5)), r: 11 };
    case 'hipFront1': return { p: add(k.hip1, add(dir(a.tT + 90, 7), dir(a.tT + 180, 2))), r: 10 };
    case 'hipFront2': return { p: add(k.hip2, add(dir(a.tT + 90, 7), dir(a.tT + 180, 2))), r: 10 };
    case 'quad1': return { p: add(mid(k.hip1, k.knee1, 0.5), dir(a.tTH1 - 90, 4)), r: 12 };
    case 'quad2': return { p: add(mid(k.hip2, k.knee2, 0.5), dir(a.tTH2 - 90, 4)), r: 12 };
    case 'hamstring1': return { p: add(mid(k.hip1, k.knee1, 0.55), dir(a.tTH1 + 90, 4)), r: 12 };
    case 'hamstring2': return { p: add(mid(k.hip2, k.knee2, 0.55), dir(a.tTH2 + 90, 4)), r: 12 };
    case 'innerThigh': return { p: mid(mid(k.hip1, k.knee1, 0.45), mid(k.hip2, k.knee2, 0.45)), r: 13 };
    case 'calf1': return { p: add(mid(k.knee1, k.ankle1, 0.35), dir(a.tSH1 + 90, 3)), r: 10 };
    case 'calf2': return { p: add(mid(k.knee2, k.ankle2, 0.35), dir(a.tSH2 + 90, 3)), r: 10 };
    case 'shinFront1': return { p: add(mid(k.knee1, k.ankle1, 0.55), dir(a.tSH1 - 90, 3)), r: 9 };
    case 'shoulder1': return { p: k.sh1, r: 10 };
    case 'forearm1': return { p: mid(k.elbow1, k.wrist1), r: 9 };
    case 'ankle1': return { p: k.ankle1, r: 8 };
    case 'sole1': return { p: mid(k.heel1, k.ball1), r: 8 };
    case 'knee1': return { p: k.knee1, r: 9 };
    case 'trap1': return { p: mid(k.sh1, k.neckTop, 0.45), r: 9 };
    case 'trap2': return { p: mid(k.sh2, k.neckTop, 0.45), r: 9 };
    case 'upperArm1': return { p: mid(k.sh1, k.elbow1), r: 9 };
  }
}

// ---------- アニメーション ----------
export type Key = { p: Partial<Pose>; d?: number; hold?: number; cue?: string };
export type Prop =
  | { type: 'chair'; key?: number }
  | { type: 'wall'; x: number }
  | { type: 'mat' }
  | { type: 'step'; x: number; w: number; h: number }
  | { type: 'table'; x: number; w: number; h: number }
  | { type: 'ball'; at: 'knees' | 'wrist1' | 'ankles'; r?: number }
  | { type: 'towelRoll'; at: 'upperBack' | 'knee1' | 'lowBack' }
  | { type: 'towel'; from: 'wrist1' | 'wrist2'; to: 'ball1' | 'ball2' | 'wrist2' | 'heel1' }
  | { type: 'towelFlat'; at: 'ball1' };
export type Anchor = 'pelvis' | 'elbow1' | 'ankle1' | 'ankle2' | 'toe1' | 'ball1' | 'ball2' | 'knee1' | 'knee2' | 'wrist1' | 'heel1' | 'heel2' | 'headC' | 'shoulderC';
export type Anim = {
  view: View;
  base?: Partial<Pose>;
  keys: Key[];
  anchor?: Anchor;
  ground?: 'auto' | 'first' | 'none';
  lift?: number; // 床から浮かせる量（椅子に座るときなど）
  props?: Prop[];
  focus?: FocusKey[];
  mirror?: boolean; // 左右を反転（左向き）
  circular?: (keyof Pose)[]; // 角度を近い向きで補間する（ぐるっと回す動き）
};

export const FLOOR = 0;

const ease = (x: number) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);

export function mergePose(base: Partial<Pose> | undefined, p: Partial<Pose>): Pose {
  return { ...BASE, ...(base ?? {}), ...p };
}

export function lerpPose(a: Pose, b: Pose, x: number, circular?: (keyof Pose)[]): Pose {
  const o = {} as Pose;
  for (const k of Object.keys(a) as (keyof Pose)[]) {
    let d = b[k] - a[k];
    if (circular?.includes(k)) d = ((((d + 180) % 360) + 360) % 360) - 180;
    o[k] = a[k] + d * x;
  }
  return o;
}

/** 1周の長さ（秒） */
export function cycleLength(anim: Anim): number {
  return anim.keys.reduce((s, k) => s + (k.d ?? 1) + (k.hold ?? 0), 0);
}

/** 時刻 time（秒）のポーズと、そのときの声かけ */
export function poseAt(anim: Anim, time: number): { pose: Pose; cue?: string; phase: number } {
  const keys = anim.keys;
  const poses = keys.map((k) => mergePose(anim.base, k.p));
  if (keys.length === 1) return { pose: poses[0], cue: keys[0].cue, phase: 0 };
  const total = cycleLength(anim);
  let t = ((time % total) + total) % total;
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    const d = k.d ?? 1;
    const from = poses[(i - 1 + keys.length) % keys.length];
    if (t < d) return { pose: lerpPose(from, poses[i], ease(t / d), anim.circular), cue: k.cue, phase: i };
    t -= d;
    const h = k.hold ?? 0;
    if (t < h) return { pose: poses[i], cue: k.cue, phase: i };
    t -= h;
  }
  return { pose: poses[0], cue: keys[0].cue, phase: 0 };
}

/** 接地・位置合わせ済みの骨格 */
export function placed(anim: Anim, pose: Pose, firstOffsetY?: number): Skeleton {
  const sk = solve(pose, anim.view);
  const anchor = anim.anchor ?? 'pelvis';
  const ap = (sk as unknown as Record<string, Pt>)[anchor] ?? sk.pelvis;
  const dx = -ap.x;
  let dy: number;
  if (anim.ground === 'none') dy = -sk.pelvis.y;
  else if (anim.ground === 'first' && firstOffsetY !== undefined) dy = firstOffsetY;
  else {
    const maxY = Math.max(...contactPoints(sk).map((q) => q.p.y + q.r));
    dy = FLOOR - maxY - (anim.lift ?? 0);
  }
  return translate(sk, dx, dy);
}

export function firstOffset(anim: Anim): number {
  const p0 = mergePose(anim.base, anim.keys[0].p);
  const sk = solve(p0, anim.view);
  const maxY = Math.max(...contactPoints(sk).map((q) => q.p.y + q.r));
  return FLOOR - maxY - (anim.lift ?? 0);
}

/** 1周ぶんの表示範囲（カメラを固定するため） */
export function frameBox(anim: Anim): { x: number; y: number; w: number; h: number } {
  const total = cycleLength(anim);
  const fo = firstOffset(anim);
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const steps = 40;
  for (let i = 0; i <= steps; i++) {
    const { pose } = poseAt(anim, (total * i) / steps);
    const sk = placed(anim, pose, fo);
    for (const q of contactPoints(sk)) {
      minX = Math.min(minX, q.p.x - q.r); maxX = Math.max(maxX, q.p.x + q.r);
      minY = Math.min(minY, q.p.y - q.r); maxY = Math.max(maxY, q.p.y + q.r);
    }
  }
  for (const pr of anim.props ?? []) {
    if (pr.type === 'wall') { minX = Math.min(minX, pr.x - 6); maxX = Math.max(maxX, pr.x + 6); }
    if (pr.type === 'step' || pr.type === 'table') { minX = Math.min(minX, pr.x - 4); maxX = Math.max(maxX, pr.x + pr.w + 4); minY = Math.min(minY, -pr.h - 4); }
    if (pr.type === 'chair') { minY = Math.min(minY, -95); }
  }
  maxY = Math.max(maxY, FLOOR);
  // 余白を取り、4:3 にそろえる
  const pad = 14;
  minX -= pad; maxX += pad; minY -= pad; maxY += 10;
  let w = maxX - minX, h = maxY - minY;
  const ratio = 4 / 3;
  if (w / h < ratio) { const nw = h * ratio; minX -= (nw - w) / 2; w = nw; }
  else { const nh = w / ratio; minY -= nh - h; h = nh; }
  return { x: minX, y: minY, w, h };
}
