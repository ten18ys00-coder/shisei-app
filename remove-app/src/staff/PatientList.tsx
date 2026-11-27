// 患者さんの一覧（続いているか・声かけが必要か がひと目でわかる）
import { useMemo, useState } from 'react';
import { BellRing, ChevronRight, Plus, Search, TrendingDown, TrendingUp, Users } from 'lucide-react';
import type { LogRow, Patient } from '../types';
import { Button, Empty, Field, Modal, inputCls } from '../components/ui';
import { summarize, type Summary } from '../components/Records';
import { addDays, todayJST } from '../lib/util';

type Row = { p: Patient; s: Summary };

function Week({ logs }: { logs: LogRow[] }) {
  const today = todayJST();
  const by = new Map(logs.map((l) => [l.day, l]));
  return (
    <div className="flex gap-[3px]">
      {Array.from({ length: 7 }, (_, i) => addDays(today, i - 6)).map((d) => {
        const l = by.get(d);
        const r = l && l.total ? l.done.length / l.total : 0;
        return <span key={d} className="h-3.5 w-3.5 rounded-[4px]" style={{ background: r >= 0.99 ? '#214d3d' : r >= 0.5 ? '#5f8a74' : r > 0 ? '#b9d0c3' : '#eef1ef' }} />;
      })}
    </div>
  );
}

export function PatientList({ patients, logsBy, onOpen, onCreate }: { patients: Patient[]; logsBy: Map<string, LogRow[]>; onOpen: (id: string) => void; onCreate: (label: string, memo: string) => Promise<void> }) {
  const [q, setQ] = useState('');
  const [show, setShow] = useState<'active' | 'alert' | 'archived'>('active');
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState('');
  const [memo, setMemo] = useState('');
  const [busy, setBusy] = useState(false);

  const rows: Row[] = useMemo(() => patients.map((p) => ({ p, s: summarize(logsBy.get(p.id) ?? []) })), [patients, logsBy]);
  const needsCall = (r: Row) => !r.p.archived && r.p.plan.items.length > 0 && ((r.s.daysSinceLast === null && daysOld(r.p) >= 3) || (r.s.daysSinceLast !== null && r.s.daysSinceLast >= 3) || (r.s.painTrend !== null && r.s.painTrend >= 1.5));
  const alertCount = rows.filter(needsCall).length;
  const list = rows
    .filter((r) => (show === 'archived' ? r.p.archived : show === 'alert' ? needsCall(r) : !r.p.archived))
    .filter((r) => !q.trim() || (r.p.label + r.p.memo).includes(q.trim()));

  const submit = async () => {
    if (!label.trim()) return;
    setBusy(true);
    try { await onCreate(label.trim(), memo.trim()); setAdding(false); setLabel(''); setMemo(''); } finally { setBusy(false); }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="呼び名・メモで探す" className="h-11 w-full rounded-xl border border-sage-200 bg-white pl-9 pr-3 focus:border-brand focus:outline-none" />
        </div>
        <Button onClick={() => setAdding(true)}><Plus size={18} /><span className="hidden sm:inline">患者さんを</span>追加</Button>
      </div>
      <div className="flex gap-1.5">
        {([['active', `通院中 ${rows.filter((r) => !r.p.archived).length}`], ['alert', `声かけ候補 ${alertCount}`], ['archived', '卒業・休止']] as const).map(([k, l]) => (
          <button key={k} type="button" onClick={() => setShow(k)} className={`rounded-full px-3 py-1.5 text-[13px] font-bold ${show === k ? (k === 'alert' ? 'bg-rose-700 text-white' : 'bg-brand text-white') : k === 'alert' && alertCount ? 'bg-rose-50 text-rose-700' : 'bg-beige text-muted'}`}>{l}</button>
        ))}
      </div>

      {list.length === 0 ? (
        patients.length === 0 ? (
          <Empty icon={<Users size={36} />} title="まだ患者さんがいません">「追加」から、運動メニューを渡したい患者さんを登録しましょう。</Empty>
        ) : <p className="py-8 text-center text-muted">{show === 'alert' ? '声かけが必要な方はいません' : '該当する方はいません'}</p>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
          {list.map(({ p, s }) => {
            const call = needsCall({ p, s });
            return (
              <li key={p.id}>
                <button type="button" onClick={() => onOpen(p.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-beige-50">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-bold">{p.label}</span>
                      {call && <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-700"><BellRing size={11} />声かけ</span>}
                      {p.plan.items.length === 0 && !p.archived && <span className="shrink-0 rounded-full bg-gold-100 px-2 py-0.5 text-[11px] font-bold text-gold-700">メニュー未作成</span>}
                    </div>
                    <div className="truncate text-[12px] text-muted">{p.plan.title || p.memo || '—'}</div>
                  </div>
                  <div className="hidden shrink-0 flex-col items-end gap-1 sm:flex">
                    <Week logs={logsBy.get(p.id) ?? []} />
                    <span className="text-[11px] text-muted">{s.daysSinceLast === null ? '記録なし' : s.daysSinceLast === 0 ? '今日 記録あり' : `${s.daysSinceLast}日前`}</span>
                  </div>
                  <div className="w-14 shrink-0 text-right">
                    <div className="text-[10px] text-muted">痛み</div>
                    <div className="flex items-center justify-end gap-0.5">
                      <span className="num font-serif text-[18px] font-bold">{s.painNow ?? '—'}</span>
                      {s.painTrend !== null && Math.abs(s.painTrend) >= 1 && (s.painTrend > 0 ? <TrendingUp size={14} className="text-rose-600" /> : <TrendingDown size={14} className="text-brand" />)}
                    </div>
                  </div>
                  <ChevronRight size={18} className="shrink-0 text-sage" />
                </button>
                <div className="-mt-1 px-4 pb-2.5 sm:hidden"><Week logs={logsBy.get(p.id) ?? []} /></div>
              </li>
            );
          })}
        </ul>
      )}
      {show === 'alert' && <p className="text-[12px] text-muted">「声かけ候補」＝3日以上記録がない方、または最近痛みの数字が上がっている方です。</p>}

      <Modal open={adding} onClose={() => setAdding(false)} title="患者さんを追加" footer={<Button className="w-full" disabled={!label.trim() || busy} onClick={submit}>{busy ? '登録中…' : '登録してメニューを作る'}</Button>}>
        <div className="space-y-3">
          <Field label="呼び名" hint="患者さんの画面に出ます。「山田さん」「Y.Tさん」など、フルネームでなくてOK。"><input className={inputCls} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="例：山田さん" maxLength={40} autoFocus /></Field>
          <Field label="院内メモ（任意・患者さんには見えません）"><textarea className={inputCls} rows={3} value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="例：右ひざ痛・階段の下りがつらい" maxLength={2000} /></Field>
        </div>
      </Modal>
    </div>
  );
}

function daysOld(p: Patient) {
  const d = p.plan.updated_at ?? p.created_at;
  return (Date.now() - new Date(d).getTime()) / 86400000;
}
