// 患者さん1人の画面：記録・メニュー・渡す・設定
import { useEffect, useMemo, useState } from 'react';
import { Archive, ChevronLeft, ClipboardList, KeyRound, Link2, Pencil, ScanLine, Send, Trash2, TrendingDown, TrendingUp } from 'lucide-react';
import type { Lib } from '../lib/library';
import { hasAnim } from '../lib/library';
import type { LogRow, Patient, Plan, PostureRecord } from '../types';
import { addDays, doseText, mdLabel, newToken, todayJST, weekday } from '../lib/util';
import { Button, Field, Modal, inputCls } from '../components/ui';
import { Figure } from '../components/Figure';
import { DoseText } from '../components/ExerciseView';
import { Calendar, PainChart, summarize } from '../components/Records';
import { PlanEditor } from './PlanEditor';
import { Handoff } from './Handoff';

type Tab = 'record' | 'menu' | 'send' | 'settings';

export function PatientDetail(props: {
  patient: Patient; logs: LogRow[]; lib: Lib;
  onBack: () => void;
  onUpdate: (patch: Partial<Patient>) => Promise<void>;
  onDelete: () => Promise<void>;
  onToast: (m: string) => void;
  onPreview: () => void;
  onPrint: () => void;
  loadPosture?: (id: string) => Promise<PostureRecord[]>;
}) {
  const { patient, logs, lib } = props;
  const startMenu = patient.plan.items.length === 0 || !!patient.proposal;
  const [tab, setTab] = useState<Tab>(startMenu ? 'menu' : 'record');
  const [editing, setEditing] = useState(startMenu);
  const [posture, setPosture] = useState<PostureRecord[] | null>(null);
  useEffect(() => {
    let alive = true;
    if (patient.posture_patient_id && props.loadPosture) props.loadPosture(patient.posture_patient_id).then((r) => alive && setPosture(r)).catch(() => alive && setPosture([]));
    return () => { alive = false; };
  }, [patient.posture_patient_id]);
  const [picked, setPicked] = useState<string | undefined>();
  const s = useMemo(() => summarize(logs), [logs]);
  const by = useMemo(() => new Map(logs.map((l) => [l.day, l])), [logs]);
  const notes = useMemo(() => logs.filter((l) => l.note).sort((a, b) => b.day.localeCompare(a.day)).slice(0, 8), [logs]);
  const today = todayJST();

  const tabs: { id: Tab; label: string }[] = [
    { id: 'record', label: '記録' }, { id: 'menu', label: 'メニュー' }, { id: 'send', label: '渡す' }, { id: 'settings', label: '設定' },
  ];

  const savePlan = async (plan: Plan, extra?: Partial<Patient>) => {
    await props.onUpdate({ plan, ...(extra ?? {}) });
    setEditing(false);
    props.onToast('メニューを保存しました');
    if (!patient.plan.items.length) setTab('send');
  };

  const pickedLog = picked ? by.get(picked) : undefined;

  return (
    <div>
      <div className="flex items-center gap-2">
        <button type="button" onClick={props.onBack} className="flex items-center gap-0.5 rounded-lg px-1.5 py-1 text-[14px] font-bold text-brand hover:bg-brand-50"><ChevronLeft size={18} />一覧</button>
      </div>
      <div className="mt-1 flex flex-wrap items-end justify-between gap-2">
        <div className="min-w-0">
          <h2 className="truncate font-serif text-[24px] font-bold text-ink">{patient.label}</h2>
          {patient.memo && <p className="text-[13px] text-muted">{patient.memo}</p>}
        </div>
        <div className="flex gap-1.5">
          {patient.posture_patient_id && <span className="flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-[12px] font-bold text-brand"><Link2 size={13} />姿勢アプリと連携</span>}
          {patient.archived && <span className="rounded-full bg-beige px-3 py-1 text-[12px] text-muted">卒業・休止中</span>}
        </div>
      </div>

      <div className="mt-3 flex gap-1 rounded-2xl bg-beige p-1">
        {tabs.map((t) => (
          <button key={t.id} type="button" onClick={() => setTab(t.id)} className={`flex-1 rounded-xl py-2 text-[14px] font-bold ${tab === t.id ? 'bg-white text-brand shadow-sm' : 'text-muted'}`}>{t.label}</button>
        ))}
      </div>

      <div className="mt-4">
        {tab === 'record' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <Stat label="この7日" value={`${s.doneDays7}日`} sub={`実施率 ${Math.round(s.rate7 * 100)}%`} />
              <Stat label="連続" value={`${s.streak}日`} sub={s.daysSinceLast === null ? '記録なし' : s.daysSinceLast === 0 ? '今日も記録あり' : `最後は${s.daysSinceLast}日前`} warn={s.daysSinceLast !== null && s.daysSinceLast >= 3} />
              <Stat
                label="痛み（0〜10）"
                value={s.painNow === null ? '—' : String(s.painNow)}
                sub={s.painFirst !== null && s.painNow !== null ? `はじめ ${s.painFirst}` : ''}
                icon={s.painTrend !== null && Math.abs(s.painTrend) >= 1 ? (s.painTrend > 0 ? <TrendingUp size={16} className="text-rose-600" /> : <TrendingDown size={16} className="text-brand" />) : null}
                warn={s.painTrend !== null && s.painTrend >= 1.5}
              />
            </div>
            <section className="rounded-2xl border border-line p-4">
              <h3 className="mb-2 text-[14px] font-bold">4週間のカレンダー</h3>
              <Calendar logs={logs} onPick={setPicked} picked={picked} />
              {picked && (
                <div className="mt-3 rounded-xl bg-beige-50 px-3 py-2 text-[13px]">
                  <b>{mdLabel(picked)}（{weekday(picked)}）</b>{' '}
                  {pickedLog ? (
                    <>
                      できた {pickedLog.done.length}/{pickedLog.total}　痛み {pickedLog.pain ?? '—'}
                      {pickedLog.done.length > 0 && <div className="mt-1 text-muted">{pickedLog.done.map((id) => { const it = patient.plan.items.find((x) => x.id === id); return it ? lib.byId[it.exId]?.name : null; }).filter(Boolean).join('・') || '（以前のメニューの運動）'}</div>}
                      {pickedLog.note && <div className="mt-1">「{pickedLog.note}」</div>}
                    </>
                  ) : '記録なし'}
                </div>
              )}
            </section>
            <section className="rounded-2xl border border-line p-4">
              <h3 className="mb-2 text-[14px] font-bold">痛みの推移</h3>
              <PainChart logs={logs} />
            </section>
            {patient.posture_patient_id && <PostureCard records={posture} />}
            <section className="rounded-2xl border border-line p-4">
              <h3 className="mb-2 text-[14px] font-bold">患者さんからのひとこと</h3>
              {notes.length ? (
                <ul className="space-y-2">
                  {notes.map((l) => <li key={l.day} className="text-[14px]"><span className="num mr-2 text-[12px] text-muted">{mdLabel(l.day)}</span>{l.note}</li>)}
                </ul>
              ) : <p className="text-[13px] text-muted">まだありません</p>}
            </section>
            <p className="text-[12px] text-muted">記録は患者さんがスマホでつけると、すぐここに届きます（{addDays(today, -90).slice(5).replace('-', '/')}以降を表示）。</p>
          </div>
        )}

        {tab === 'menu' && patient.proposal && !editing && (
          <button type="button" onClick={() => setEditing(true)} className="mb-3 flex w-full items-center gap-2 rounded-2xl border-2 border-gold/50 bg-gold-100/50 px-4 py-3 text-left font-bold text-gold-700"><ScanLine size={18} />姿勢分析からの提案が届いています（開く）</button>
        )}
        {tab === 'menu' && (
          editing ? (
            <PlanEditor patient={patient} lib={lib} onSave={savePlan} onClose={() => setEditing(false)} />
          ) : (
            <div className="space-y-3">
              {patient.plan.title && <div className="font-serif text-[18px] font-bold text-brand">{patient.plan.title}</div>}
              {patient.plan.message && <div className="rounded-xl bg-beige-50 px-4 py-3 text-[14px]"><b className="text-brand">先生から：</b>{patient.plan.message}</div>}
              {patient.plan.items.length === 0 && <p className="text-muted">まだメニューがありません。</p>}
              <ol className="space-y-2">
                {patient.plan.items.map((it, i) => {
                  const ex = lib.byId[it.exId];
                  if (!ex) return null;
                  return (
                    <li key={it.id} className="flex items-center gap-3 rounded-2xl border border-line p-2.5">
                      <span className="num w-5 text-center font-bold text-sage">{i + 1}</span>
                      <div className="fig-bg h-14 w-[74px] shrink-0 overflow-hidden rounded-lg">{hasAnim(ex) && <Figure anim={ex.anim} fps={20} className="h-full w-full" />}</div>
                      <div className="min-w-0">
                        <div className="truncate font-bold">{ex.name}</div>
                        <div className="text-[13px] text-brand"><DoseText text={doseText(it)} /></div>
                        {it.note && <div className="truncate text-[12px] text-gold-700">「{it.note}」</div>}
                      </div>
                    </li>
                  );
                })}
              </ol>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button onClick={() => setEditing(true)}><Pencil size={16} />メニューを直す</Button>
                {patient.plan.items.length > 0 && <Button variant="soft" onClick={() => setTab('send')}><Send size={16} />患者さんに渡す</Button>}
              </div>
              {patient.plan.updated_at && <p className="text-[12px] text-muted">最終更新 {new Date(patient.plan.updated_at).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}</p>}
            </div>
          )
        )}

        {tab === 'send' && <Handoff patient={patient} onToast={props.onToast} onPreview={props.onPreview} onPrint={props.onPrint} />}

        {tab === 'settings' && <Settings {...props} />}
      </div>
    </div>
  );
}

function Stat({ label, value, sub, warn, icon }: { label: string; value: string; sub?: string; warn?: boolean; icon?: React.ReactNode }) {
  return (
    <div className={`rounded-2xl border p-3 ${warn ? 'border-rose-200 bg-rose-50/50' : 'border-line bg-white'}`}>
      <div className="text-[11px] text-muted">{label}</div>
      <div className="flex items-center gap-1"><span className="num font-serif text-[24px] font-bold text-ink">{value}</span>{icon}</div>
      {sub && <div className={`text-[11px] ${warn ? 'text-rose-700' : 'text-muted'}`}>{sub}</div>}
    </div>
  );
}

function Settings({ patient, onUpdate, onDelete, onToast, onBack }: Parameters<typeof PatientDetail>[0]) {
  const [label, setLabel] = useState(patient.label);
  const [memo, setMemo] = useState(patient.memo);
  const [confirmDel, setConfirmDel] = useState(false);
  const [confirmKey, setConfirmKey] = useState(false);
  const save = async () => { await onUpdate({ label: label.trim() || patient.label, memo }); onToast('保存しました'); };
  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <Field label="呼び名" hint="患者さんの画面に「〇〇さんの運動メニュー」と出ます。フルネームでなくても大丈夫です。"><input className={inputCls} value={label} onChange={(e) => setLabel(e.target.value)} maxLength={40} /></Field>
        <Field label="院内メモ（患者さんには見えません）"><textarea className={inputCls} rows={3} value={memo} onChange={(e) => setMemo(e.target.value)} maxLength={2000} /></Field>
        <Button onClick={save} disabled={label === patient.label && memo === patient.memo}>保存</Button>
      </div>
      <div className="space-y-2 border-t border-line pt-4">
        <Button variant="soft" onClick={async () => { await onUpdate({ archived: !patient.archived }); onToast(patient.archived ? '再開しました' : '卒業・休止にしました'); }}>
          <Archive size={16} />{patient.archived ? '運動メニューを再開する' : '卒業・休止にする（リンクを止める）'}
        </Button>
        <p className="text-[12px] text-muted">卒業・休止にすると、患者さんのリンクは開けなくなります。記録は残ります。</p>
        <Button variant="soft" onClick={() => setConfirmKey(true)}><KeyRound size={16} />リンクを作り直す</Button>
        <Button variant="danger" onClick={() => setConfirmDel(true)}><Trash2 size={16} />この患者さんを削除</Button>
      </div>
      <Modal open={confirmKey} onClose={() => setConfirmKey(false)} title="リンクを作り直しますか？" footer={<div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setConfirmKey(false)}>やめる</Button><Button onClick={async () => { await onUpdate({ token: newToken() }); setConfirmKey(false); onToast('新しいリンクにしました'); }}>作り直す</Button></div>}>
        <p className="text-[14px]">今のリンク（QRコード）は使えなくなります。患者さんには新しいリンクを渡し直してください。</p>
      </Modal>
      <Modal open={confirmDel} onClose={() => setConfirmDel(false)} title="削除しますか？" footer={<div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setConfirmDel(false)}>やめる</Button><Button className="bg-rose-700 hover:bg-rose-800" onClick={async () => { await onDelete(); setConfirmDel(false); onToast('削除しました'); onBack(); }}>削除する</Button></div>}>
        <p className="text-[14px]"><b>{patient.label}</b> のメニューと、これまでの記録がすべて消え、元に戻せません。通院が終わっただけなら「卒業・休止」がおすすめです。</p>
      </Modal>
      <div className="flex items-center gap-2 rounded-xl bg-beige-50 px-3 py-2 text-[12px] text-muted"><ClipboardList size={14} />登録日 {patient.created_at.slice(0, 10).replace(/-/g, '/')}</div>
    </div>
  );
}

/** 姿勢アプリの総合スコアの変化 */
function PostureCard({ records }: { records: PostureRecord[] | null }) {
  if (records === null) return <section className="rounded-2xl border border-line p-4 text-[13px] text-muted">姿勢分析の記録を読み込み中…</section>;
  const rs = records.filter((r) => r.total !== null);
  const first = rs[0], last = rs[rs.length - 1];
  const W = 320, H = 110, pl = 24, pr = 8, pt = 10, pb = 20;
  const x = (i: number) => pl + (rs.length <= 1 ? (W - pl - pr) / 2 : (i / (rs.length - 1)) * (W - pl - pr));
  const lo = 40;
  const y = (v: number) => pt + (1 - (v - lo) / (100 - lo)) * (H - pt - pb);
  const md = (iso: string) => { const d = new Date(iso); return `${d.getMonth() + 1}/${d.getDate()}`; };
  return (
    <section className="rounded-2xl border border-line p-4">
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <h3 className="text-[14px] font-bold">姿勢スコアの変化（姿勢アプリ）</h3>
        {first && last && rs.length > 1 && <span className="text-[13px] text-muted">はじめ <b className="num">{first.total}</b> → 今 <b className="num text-brand">{last.total}</b>{(last.total ?? 0) - (first.total ?? 0) !== 0 && <span className={`ml-1 font-bold ${(last.total ?? 0) > (first.total ?? 0) ? 'text-brand' : 'text-rose-700'}`}>{(last.total ?? 0) > (first.total ?? 0) ? '+' : ''}{(last.total ?? 0) - (first.total ?? 0)}点</span>}</span>}
      </div>
      {!rs.length ? <p className="text-[13px] text-muted">姿勢分析の記録はまだありません</p> : (
        <>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="姿勢スコアの変化">
            {[50, 75, 100].map((v) => <g key={v}><line x1={pl} x2={W - pr} y1={y(v)} y2={y(v)} stroke="#e3e7e4" strokeDasharray="3 3" /><text x={pl - 4} y={y(v) + 3} fontSize="9" textAnchor="end" fill="#5b6863">{v}</text></g>)}
            <path d={rs.map((r, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(r.total ?? 0).toFixed(1)}`).join('')} fill="none" stroke="#214d3d" strokeWidth="2.2" strokeLinejoin="round" />
            {rs.map((r, i) => <g key={i}><circle cx={x(i)} cy={y(r.total ?? 0)} r="3.2" fill="#fff" stroke="#214d3d" strokeWidth="1.8" /><text x={x(i)} y={H - 5} fontSize="9" textAnchor={rs.length > 1 && i === rs.length - 1 ? 'end' : rs.length > 1 && i === 0 ? 'start' : 'middle'} fill="#5b6863">{md(r.date)}</text></g>)}
          </svg>
          {last?.type && <p className="mt-1 text-[13px]">最新の姿勢タイプ：<b>{last.type}</b></p>}
        </>
      )}
    </section>
  );
}
