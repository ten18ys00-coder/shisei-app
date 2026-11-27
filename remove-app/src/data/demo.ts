// お試し版の架空データ（実在の患者さんではありません）
import type { LibEntry, LogRow, Patient, PlanItem, PostureRecord } from '../types';
import { EX_BY_ID } from './exercises';

function dayStr(offset: number) {
  const d = new Date(Date.now() + 9 * 3600 * 1000);
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
}
function items(ids: string[]): PlanItem[] {
  return ids.map((exId, i) => {
    const d = EX_BY_ID[exId].dose;
    return { id: `d${i}${exId.slice(0, 3)}`, exId, ...d };
  });
}
function hex(seed: number) {
  let s = '';
  let x = seed >>> 0;
  for (let i = 0; i < 32; i++) { x = (Math.imul(x, 1664525) + 1013904223) >>> 0; s += (x >>> 28).toString(16); }
  return s;
}

export function demoSeed(): { patients: Patient[]; logs: LogRow[]; library: LibEntry[]; posture: Record<string, PostureRecord[]> } {
  const now = new Date().toISOString();
  const mk = (n: number, label: string, memo: string, title: string, message: string, ids: string[], daysAgo: number): Patient => ({
    id: `demo${n}`, label, memo, token: hex(n + 7), archived: false,
    plan: { title, message, items: items(ids), updated_at: now },
    created_at: dayStr(-daysAgo) + 'T09:00:00.000Z', updated_at: now,
  });
  const patients = [
    mk(1, '山田さん（デモ）', '40代・デスクワーク。首〜肩のこり、夕方に頭が重い。姿勢診断で頭が前。', '首・肩をラクにする3週間', 'まずは「あご引き」だけでも毎日。仕事の合間に1回でOKです。', ['chin-tuck', 'scapula-squeeze', 'shoulder-roll', 'neck-back-stretch', 'forearm-stretch'], 24),
    mk(2, '佐藤さん（デモ）', '60代・右ひざの痛み。階段の下りがつらい。', 'ひざの土台づくり', '痛みが強い日は「タオルつぶし」だけで大丈夫です。', ['quad-set', 'seated-knee-ext', 'slr', 'sit-to-stand', 'calf-raise'], 30),
    mk(3, '鈴木さん（デモ）', '高校2年・サッカー部。右足首ねんざ後、復帰に向けて。', '復帰までのメニュー', 'ねんざは「痛みが消えた＝治った」ではありません。再発しない足首をつくろう。', ['ankle-pump', 'towel-gather', 'calf-raise', 'single-leg-stand', 'bird-dog'], 18),
    mk(4, '高橋さん（デモ）', '50代・慢性腰痛。朝の立ち上がりがつらい。', '', '', ['knees-to-chest', 'pelvic-tilt', 'draw-in', 'cat-cow'], 12),
  ];
  patients[0].posture_patient_id = 'demo-pp1';
  patients[0].proposal = {
    from: 'posture', at: now, date: dayStr(0) + 'T01:00:00.000Z', type: '猫背＋頭が前に出る傾向', total: 74,
    findings: [
      { label: '頭の前後位置', dir: '頭が肩より前に出ている', st: 'ng' },
      { label: '上半身の前後の傾き', dir: '上半身が前に傾いている', st: 'wn' },
      { label: '肩の高さ', dir: '右肩が下がっている', st: 'wn' },
    ],
    items: [
      { exId: 'chin-tuck', why: '頭が肩より前に出ている' },
      { exId: 'chest-open', why: '上半身が前に傾いている' },
      { exId: 'wall-slide', why: '頭が肩より前に出ている・上半身が前に傾いている' },
      { exId: 'neck-side-stretch', note: '左側を重点的に', why: '右肩が下がっている' },
      { exId: 'towel-thoracic', why: '上半身が前に傾いている' },
    ],
    unmapped: [],
  };
  patients[2].posture_patient_id = 'demo-pp3';
  const posture: Record<string, PostureRecord[]> = {
    'demo-pp1': [
      { date: dayStr(-24) + 'T01:00:00.000Z', total: 66, front: 80, side: 52, rot: 88, type: '猫背＋頭が前に出る傾向' },
      { date: dayStr(-10) + 'T01:00:00.000Z', total: 71, front: 82, side: 61, rot: 90, type: '猫背＋頭が前に出る傾向' },
      { date: dayStr(0) + 'T01:00:00.000Z', total: 74, front: 84, side: 66, rot: 91, type: '猫背＋頭が前に出る傾向' },
    ],
    'demo-pp3': [
      { date: dayStr(-18) + 'T01:00:00.000Z', total: 82, front: 78, side: 86, rot: 92, type: '軽いくずれ' },
      { date: dayStr(-4) + 'T01:00:00.000Z', total: 88, front: 86, side: 89, rot: 94, type: '理想に近いバランス' },
    ],
  };
  const logs: LogRow[] = [];
  const pattern: Record<string, (i: number) => number> = {
    demo1: (i) => (i % 7 === 3 ? 0 : i % 5 === 0 ? 0.6 : 1),
    demo2: (i) => (i < 12 ? (i % 3 === 0 ? 0 : 0.8) : 1),
    demo3: () => 1,
    demo4: (i) => (i > 6 ? 0 : i % 2 ? 1 : 0.5),
  };
  const painStart: Record<string, number> = { demo1: 6, demo2: 7, demo3: 4, demo4: 6 };
  for (const p of patients) {
    const span = Math.min(28, Math.floor((Date.now() - new Date(p.created_at).getTime()) / 86400000));
    for (let i = 0; i < span; i++) {
      const offset = -span + i + (p.id === 'demo4' ? -4 : 0);
      if (offset >= 0) continue;
      const rate = pattern[p.id](i);
      if (rate <= 0) continue;
      const n = Math.max(1, Math.round(p.plan.items.length * rate));
      const pain = Math.max(1, Math.round(painStart[p.id] - (i / span) * (p.id === 'demo4' ? 1 : 3.4) + (i % 4 === 1 ? 1 : 0)));
      logs.push({
        patient_id: p.id, day: dayStr(offset), done: p.plan.items.slice(0, n).map((x) => x.id), total: p.plan.items.length,
        pain, note: i === span - 3 && p.id === 'demo1' ? '今日は頭の重さがなかった！' : i === 8 && p.id === 'demo2' ? '階段を下りるのが少し楽' : '',
      });
    }
  }
  return { patients, logs, library: [], posture };
}
