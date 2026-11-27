// メニューを作る・直す
import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronLeft, Layers, Plus, ScanLine, Trash2, X } from 'lucide-react';
import type { Exercise } from '../data/exercises';
import { TEMPLATES } from '../data/templates';
import type { Lib } from '../lib/library';
import { hasAnim } from '../lib/library';
import type { Patient, Plan, PlanItem, Proposal } from '../types';
import { doseText, rid } from '../lib/util';
import { Button, Field, Modal, inputCls } from '../components/ui';
import { Figure } from '../components/Figure';
import { DoseText, ExerciseBody } from '../components/ExerciseView';
import { ExCard, Filters, useFilter } from './Browser';

function itemFrom(ex: Exercise): PlanItem {
  const d = ex.dose;
  return { id: rid(8), exId: ex.id, reps: d.reps, sets: d.sets, hold: d.hold, seconds: d.seconds, perDay: d.perDay, sides: d.sides };
}

const num = (v: string) => (v === '' ? undefined : Math.max(0, Math.min(999, Math.round(Number(v)) || 0)) || undefined);

function ItemEditor({ item, ex, onChange }: { item: PlanItem; ex: Exercise; onChange: (p: PlanItem) => void }) {
  const box = 'h-10 w-full rounded-lg border border-sage-200 bg-white px-2 text-center num focus:border-brand focus:outline-none';
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-5 gap-2 text-[12px] text-muted">
        <label>回数<input inputMode="numeric" className={box} value={item.reps ?? ''} onChange={(e) => onChange({ ...item, reps: num(e.target.value) })} /></label>
        <label>キープ秒<input inputMode="numeric" className={box} value={item.hold ?? ''} onChange={(e) => onChange({ ...item, hold: num(e.target.value) })} /></label>
        <label>時間(秒)<input inputMode="numeric" className={box} value={item.seconds ?? ''} onChange={(e) => onChange({ ...item, seconds: num(e.target.value) })} /></label>
        <label>セット<input inputMode="numeric" className={box} value={item.sets ?? ''} onChange={(e) => onChange({ ...item, sets: num(e.target.value) })} /></label>
        <label>1日<input inputMode="numeric" className={box} value={item.perDay ?? ''} onChange={(e) => onChange({ ...item, perDay: num(e.target.value) })} /></label>
      </div>
      <label className="flex items-center gap-2 text-[14px]">
        <input type="checkbox" className="h-5 w-5 accent-[#214d3d]" checked={!!item.sides} onChange={(e) => onChange({ ...item, sides: e.target.checked })} />
        左右それぞれ行う
      </label>
      <input className={inputCls} placeholder={`この方への一言（例：痛みのない範囲で${ex.position === 'floor' ? '、布団の上でもOK' : ''}）`} value={item.note ?? ''} onChange={(e) => onChange({ ...item, note: e.target.value })} maxLength={120} />
    </div>
  );
}

const STL: Record<string, string> = { ok: '良好', wn: '注意', ng: '要改善' };

/** 姿勢アプリから届いた提案 */
function ProposalCard({ p, lib, have, onAdd, onDismiss }: { p: Proposal; lib: Lib; have: Set<string>; onAdd: (ids: string[]) => void; onDismiss: () => void }) {
  const items = p.items.filter((i) => lib.byId[i.exId]);
  const [pick, setPick] = useState<Set<string>>(() => new Set(items.filter((i) => !have.has(i.exId)).map((i) => i.exId)));
  const d = p.date ? new Date(p.date) : null;
  return (
    <div className="rounded-2xl border-2 border-gold/50 bg-gold-100/50 p-4">
      <div className="flex items-start gap-2">
        <ScanLine size={20} className="mt-0.5 shrink-0 text-gold-700" />
        <div className="min-w-0 flex-1">
          <div className="font-bold text-ink">{p.from === 'gait' ? '歩行分析' : '姿勢分析'}からの提案{d && <span className="ml-1 text-[13px] font-normal text-muted">（{d.getMonth() + 1}/{d.getDate()}の分析）</span>}</div>
          {(p.type || p.total != null) && <div className="text-[13px] text-muted">{p.type}{p.total != null && <span className="ml-2">総合 <b className="num text-ink">{p.total}</b>点</span>}</div>}
        </div>
        <button type="button" onClick={onDismiss} className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted hover:bg-white" aria-label="提案を閉じる"><X size={18} /></button>
      </div>
      {!!p.findings?.length && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {p.findings.map((f, i) => <span key={i} className={`rounded-full px-2 py-0.5 text-[12px] ${f.st === 'ng' ? 'bg-rose-100 text-rose-800' : 'bg-white text-gold-700'}`}>{f.dir}（{STL[f.st] ?? ''}）</span>)}
        </div>
      )}
      <ul className="mt-3 space-y-1.5">
        {items.map((i) => {
          const ex = lib.byId[i.exId];
          const already = have.has(i.exId);
          return (
            <li key={i.exId}>
              <label className="flex items-start gap-2.5 rounded-xl bg-white px-3 py-2">
                <input type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-[#214d3d]" checked={pick.has(i.exId)} onChange={(e) => setPick((s) => { const n = new Set(s); if (e.target.checked) n.add(i.exId); else n.delete(i.exId); return n; })} />
                <span className="min-w-0">
                  <b className="text-[14px]">{ex.name}</b>{already && <span className="ml-1 text-[11px] text-muted">（メニューに入っています）</span>}
                  {i.note && <span className="block text-[12px] font-bold text-gold-700">{i.note}</span>}
                  {i.why && <span className="block text-[12px] text-muted">理由：{i.why}</span>}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
      {!!p.unmapped?.length && <p className="mt-2 text-[12px] text-muted">Re:MOVEにまだない運動：{p.unmapped.join('・')}（「院オリジナルを追加」で作れます）</p>}
      <Button className="mt-3 w-full" disabled={!pick.size} onClick={() => onAdd([...pick])}><Plus size={17} />選んだ{pick.size}つをメニューに入れる</Button>
    </div>
  );
}

export function PlanEditor({ patient, lib, onSave, onClose }: { patient: Patient; lib: Lib; onSave: (plan: Plan, extra?: Partial<Patient>) => Promise<void>; onClose: () => void }) {
  const [plan, setPlan] = useState<Plan>(() => JSON.parse(JSON.stringify(patient.plan)) as Plan);
  const [proposal, setProposal] = useState<Proposal | null>(patient.proposal ?? null);
  const [picking, setPicking] = useState(false);
  const [tpl, setTpl] = useState(false);
  const [openEx, setOpenEx] = useState<Exercise | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const f = useFilter(lib.all);
  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const i of plan.items) m[i.exId] = (m[i.exId] ?? 0) + 1;
    return m;
  }, [plan.items]);

  const add = (ex: Exercise) => setPlan((p) => ({ ...p, items: [...p.items, itemFrom(ex)] }));
  const move = (i: number, d: number) => setPlan((p) => {
    const items = [...p.items];
    const j = i + d;
    if (j < 0 || j >= items.length) return p;
    [items[i], items[j]] = [items[j], items[i]];
    return { ...p, items };
  });
  const update = (it: PlanItem) => setPlan((p) => ({ ...p, items: p.items.map((x) => (x.id === it.id ? it : x)) }));
  const remove = (id: string) => setPlan((p) => ({ ...p, items: p.items.filter((x) => x.id !== id) }));
  const proposalDone = !!patient.proposal && !proposal;
  const changed = JSON.stringify(plan) !== JSON.stringify(patient.plan) || proposalDone;

  const save = async () => {
    setBusy(true);
    try { await onSave({ ...plan, updated_at: new Date().toISOString() }, proposalDone ? { proposal: null } : undefined); } finally { setBusy(false); }
  };
  const addProposal = (ids: string[]) => {
    if (!proposal) return;
    const add = proposal.items.filter((i) => ids.includes(i.exId) && lib.byId[i.exId]).map((i) => ({ ...itemFrom(lib.byId[i.exId]), note: i.note }));
    setPlan((p) => ({ ...p, title: p.title || (proposal.type ? `姿勢リセット（${proposal.type.replace(/傾向$/, '')}）` : '姿勢リセット'), items: [...p.items, ...add] }));
    setProposal(null);
  };

  if (picking) {
    return (
      <div className="space-y-3">
        <div className="sticky top-0 z-10 -mx-4 flex items-center gap-2 border-b border-line bg-white/95 px-4 py-2 backdrop-blur">
          <button type="button" onClick={() => setPicking(false)} className="flex items-center gap-1 rounded-lg px-2 py-1.5 font-bold text-brand hover:bg-brand-50"><ChevronLeft size={18} />メニューに戻る</button>
          <span className="ml-auto text-[13px] text-muted">選んだ運動 <b className="num text-brand">{plan.items.length}</b></span>
        </div>
        <Filters f={f} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {f.list.map((ex) => <ExCard key={ex.id} ex={ex} onOpen={() => setOpenEx(ex)} onAdd={() => add(ex)} added={counts[ex.id]} />)}
        </div>
        {!f.list.length && <p className="py-10 text-center text-muted">条件に合う運動がありません</p>}
        <Modal open={!!openEx} onClose={() => setOpenEx(null)} title={openEx?.name} footer={openEx && <Button className="w-full" onClick={() => { add(openEx); setOpenEx(null); }}><Plus size={18} />メニューに追加</Button>}>
          {openEx && <ExerciseBody ex={openEx} doseLine={doseText(openEx.dose)} />}
        </Modal>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {proposal && <ProposalCard p={proposal} lib={lib} have={new Set(plan.items.map((i) => i.exId))} onAdd={addProposal} onDismiss={() => setProposal(null)} />}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="メニューの名前（任意）"><input className={inputCls} value={plan.title} onChange={(e) => setPlan({ ...plan, title: e.target.value })} placeholder="例：ひざの土台づくり" maxLength={40} /></Field>
        <Field label="先生からひとこと（患者さんの画面のいちばん上に出ます）">
          <textarea className={inputCls} rows={2} value={plan.message} onChange={(e) => setPlan({ ...plan, message: e.target.value })} placeholder="例：まずは1日1回でOK。痛みが強くなる運動は休んで、次回教えてください。" maxLength={300} />
        </Field>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setPicking(true)}><Plus size={18} />運動を選ぶ</Button>
        <Button variant="soft" onClick={() => setTpl(true)}><Layers size={17} />セットから追加</Button>
      </div>

      {plan.items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-sage-200 bg-beige-50 px-6 py-10 text-center text-muted">「運動を選ぶ」か「セットから追加」で、この方のメニューを作ります。</div>
      ) : (
        <ol className="space-y-2">
          {plan.items.map((it, i) => {
            const ex = lib.byId[it.exId];
            if (!ex) return (
              <li key={it.id} className="flex items-center gap-3 rounded-2xl border border-line p-3 text-muted">（削除された運動）<button type="button" className="ml-auto text-rose-700" onClick={() => remove(it.id)}><Trash2 size={18} /></button></li>
            );
            const open = editing === it.id;
            return (
              <li key={it.id} className="rounded-2xl border border-line bg-white p-3">
                <div className="flex items-center gap-3">
                  <span className="num w-5 text-center font-bold text-sage">{i + 1}</span>
                  <button type="button" onClick={() => setOpenEx(ex)} className="fig-bg h-14 w-[74px] shrink-0 overflow-hidden rounded-lg">
                    {hasAnim(ex) && <Figure anim={ex.anim} staticKey={Math.min(1, ex.anim.keys.length - 1)} className="h-full w-full" />}
                  </button>
                  <button type="button" onClick={() => setEditing(open ? null : it.id)} className="min-w-0 flex-1 text-left">
                    <div className="truncate font-bold">{ex.name}</div>
                    <div className="text-[13px] text-brand"><DoseText text={doseText(it)} /></div>
                    {it.note && <div className="truncate text-[12px] text-gold-700">「{it.note}」</div>}
                  </button>
                  <div className="flex shrink-0 flex-col">
                    <button type="button" aria-label="上へ" disabled={i === 0} onClick={() => move(i, -1)} className="grid h-7 w-8 place-items-center rounded text-muted disabled:opacity-30"><ArrowUp size={16} /></button>
                    <button type="button" aria-label="下へ" disabled={i === plan.items.length - 1} onClick={() => move(i, 1)} className="grid h-7 w-8 place-items-center rounded text-muted disabled:opacity-30"><ArrowDown size={16} /></button>
                  </div>
                </div>
                {open && (
                  <div className="mt-3 border-t border-line pt-3">
                    <ItemEditor item={it} ex={ex} onChange={update} />
                    <div className="mt-3 flex justify-between">
                      <Button variant="danger" size="sm" onClick={() => remove(it.id)}><Trash2 size={15} />はずす</Button>
                      <Button variant="soft" size="sm" onClick={() => setEditing(null)}>閉じる</Button>
                    </div>
                  </div>
                )}
                {!open && <button type="button" onClick={() => setEditing(it.id)} className="mt-1 pl-8 text-[12px] text-muted underline-offset-2 hover:underline">回数・一言を変える</button>}
              </li>
            );
          })}
        </ol>
      )}

      <div className="sticky bottom-0 -mx-4 flex gap-2 border-t border-line bg-white/95 px-4 py-3 backdrop-blur safe-b">
        <Button variant="ghost" onClick={onClose}>やめる</Button>
        <Button className="flex-1" disabled={!changed || busy} onClick={save}>{busy ? '保存中…' : changed ? 'メニューを保存（患者さんの画面にすぐ反映）' : '変更なし'}</Button>
      </div>

      <Modal open={tpl} onClose={() => setTpl(false)} title="セットから追加">
        <p className="mb-3 text-[13px] text-muted">セットの運動をまとめて追加します。追加したあとで、はずしたり回数を変えたりできます。</p>
        <div className="space-y-2">
          {TEMPLATES.map((t) => (
            <button
              type="button"
              key={t.id}
              onClick={() => {
                setPlan((p) => ({ ...p, title: p.title || t.name, items: [...p.items, ...t.items.filter((id) => lib.byId[id]).map((id) => itemFrom(lib.byId[id]))] }));
                setTpl(false);
              }}
              className="block w-full rounded-2xl border border-line p-3 text-left hover:border-brand"
            >
              <div className="font-bold text-brand">{t.name}</div>
              <div className="text-[13px] text-muted">{t.note}</div>
              <div className="mt-1 text-[12px] text-ink">{t.items.map((id) => lib.byId[id]?.name).filter(Boolean).join('・')}</div>
            </button>
          ))}
        </div>
      </Modal>
      <Modal open={!!openEx} onClose={() => setOpenEx(null)} title={openEx?.name}>
        {openEx && <ExerciseBody ex={openEx} doseLine={doseText(openEx.dose)} />}
      </Modal>
    </div>
  );
}
