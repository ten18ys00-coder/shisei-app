// 記録の見える化：カレンダー（実施率）・痛みの推移
import type { LogRow } from '../types';
import { addDays, mdLabel, todayJST, weekday } from '../lib/util';

export function rateOf(l: LogRow | undefined) {
  if (!l || !l.total) return 0;
  return Math.min(1, l.done.length / l.total);
}

export type Summary = { last?: LogRow; daysSinceLast: number | null; rate7: number; doneDays7: number; streak: number; painNow: number | null; painFirst: number | null; painTrend: number | null };

export function summarize(logs: LogRow[], today = todayJST()): Summary {
  const by = new Map(logs.map((l) => [l.day, l]));
  const active = logs.filter((l) => l.done.length > 0 || l.pain !== null).sort((a, b) => a.day.localeCompare(b.day));
  const last = active[active.length - 1];
  let rateSum = 0, doneDays7 = 0;
  for (let i = 0; i < 7; i++) {
    const l = by.get(addDays(today, -i));
    rateSum += rateOf(l);
    if (l && l.done.length) doneDays7++;
  }
  let streak = 0;
  for (let i = by.get(today)?.done.length ? 0 : 1; i < 400; i++) {
    const l = by.get(addDays(today, -i));
    if (l && l.done.length) streak++; else break;
  }
  const pains = active.filter((l) => l.pain !== null);
  const painNow = pains.length ? pains[pains.length - 1].pain : null;
  const painFirst = pains.length ? pains[0].pain : null;
  let painTrend: number | null = null;
  if (pains.length >= 4) {
    const recent = pains.slice(-3).reduce((s, l) => s + (l.pain ?? 0), 0) / 3;
    const before = pains.slice(-10, -3);
    if (before.length) painTrend = recent - before.reduce((s, l) => s + (l.pain ?? 0), 0) / before.length;
  }
  const daysSinceLast = last ? Math.round((new Date(today).getTime() - new Date(last.day).getTime()) / 86400000) : null;
  return { last, daysSinceLast, rate7: rateSum / 7, doneDays7, streak, painNow, painFirst, painTrend };
}

/** 4週間のカレンダー（色の濃さ＝その日にできた割合） */
export function Calendar({ logs, weeks = 4, today = todayJST(), onPick, picked }: { logs: LogRow[]; weeks?: number; today?: string; onPick?: (day: string) => void; picked?: string }) {
  const by = new Map(logs.map((l) => [l.day, l]));
  const dow = new Date(today + 'T00:00:00Z').getUTCDay();
  const end = addDays(today, 6 - dow);
  const start = addDays(end, -(weeks * 7 - 1));
  const days: string[] = [];
  for (let i = 0; i < weeks * 7; i++) days.push(addDays(start, i));
  return (
    <div>
      <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[11px] text-muted">
        {['日', '月', '火', '水', '木', '金', '土'].map((d) => <div key={d}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((d) => {
          const l = by.get(d);
          const r = rateOf(l);
          const future = d > today;
          const bg = future ? '#fafbfa' : r >= 0.99 ? '#214d3d' : r >= 0.5 ? '#5f8a74' : r > 0 ? '#b9d0c3' : '#f1f4f2';
          const fg = r >= 0.5 && !future ? '#fff' : '#5b6863';
          return (
            <button
              type="button"
              key={d}
              disabled={future || !onPick}
              onClick={() => onPick?.(d)}
              className={`relative flex aspect-square flex-col items-center justify-center rounded-lg text-[11px] leading-none ${picked === d ? 'ring-2 ring-gold' : ''} ${d === today ? 'outline outline-2 outline-offset-1 outline-gold/60' : ''}`}
              style={{ background: bg, color: fg }}
              title={`${mdLabel(d)}（${weekday(d)}）`}
            >
              <span className="num">{Number(d.slice(8))}</span>
              {l && l.pain !== null && !future && <span className="num mt-0.5 text-[9px] opacity-90">痛{l.pain}</span>}
              {l?.note && <span className="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-gold" />}
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-muted">
        <span className="flex items-center gap-1"><i className="inline-block h-3 w-3 rounded" style={{ background: '#214d3d' }} />全部できた</span>
        <span className="flex items-center gap-1"><i className="inline-block h-3 w-3 rounded" style={{ background: '#5f8a74' }} />半分以上</span>
        <span className="flex items-center gap-1"><i className="inline-block h-3 w-3 rounded" style={{ background: '#b9d0c3' }} />少し</span>
        <span className="flex items-center gap-1"><i className="inline-block h-2 w-2 rounded-full bg-gold" />ひとことあり</span>
      </div>
    </div>
  );
}

/** 痛みの推移（0〜10） */
export function PainChart({ logs, days = 28, today = todayJST() }: { logs: LogRow[]; days?: number; today?: string }) {
  const start = addDays(today, -(days - 1));
  const pts = logs.filter((l) => l.pain !== null && l.day >= start && l.day <= today).sort((a, b) => a.day.localeCompare(b.day));
  const W = 320, H = 120, padL = 22, padB = 18, padT = 8, padR = 6;
  const x = (d: string) => padL + ((new Date(d).getTime() - new Date(start).getTime()) / 86400000 / (days - 1)) * (W - padL - padR);
  const y = (p: number) => padT + (1 - p / 10) * (H - padT - padB);
  if (!pts.length) return <div className="rounded-xl bg-beige-50 px-4 py-6 text-center text-[13px] text-muted">痛みの記録はまだありません</div>;
  const path = pts.map((l, i) => `${i ? 'L' : 'M'}${x(l.day).toFixed(1)} ${y(l.pain ?? 0).toFixed(1)}`).join('');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="痛みの推移">
      {[0, 5, 10].map((v) => (
        <g key={v}>
          <line x1={padL} x2={W - padR} y1={y(v)} y2={y(v)} stroke="#e3e7e4" strokeDasharray={v === 0 ? '' : '3 3'} />
          <text x={padL - 5} y={y(v) + 3.5} fontSize="9" textAnchor="end" fill="#5b6863">{v}</text>
        </g>
      ))}
      <text x={padL} y={H - 4} fontSize="9" fill="#5b6863">{mdLabel(start)}</text>
      <text x={W - padR} y={H - 4} fontSize="9" textAnchor="end" fill="#5b6863">今日</text>
      <path d={path} fill="none" stroke="#b8914a" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
      {pts.map((l) => <circle key={l.day} cx={x(l.day)} cy={y(l.pain ?? 0)} r="2.8" fill="#fff" stroke="#b8914a" strokeWidth="1.6" />)}
    </svg>
  );
}
