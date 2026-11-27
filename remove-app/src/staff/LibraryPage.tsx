// 運動ライブラリ：見る・先生の動画を差し込む・院オリジナルの運動を足す
import { useState } from 'react';
import { Plus, Video } from 'lucide-react';
import { AREA_LABEL, AREA_ORDER, EX_BY_ID, EXERCISES, POSITION_LABEL, PURPOSE_LABEL, type Area, type Exercise, type Position, type Purpose } from '../data/exercises';
import type { Lib } from '../lib/library';
import type { CustomExercise, LibData } from '../types';
import { doseText, rid, youtubeId } from '../lib/util';
import { Button, Chip, Field, Modal, inputCls } from '../components/ui';
import { ExerciseBody } from '../components/ExerciseView';
import { ExCard, Filters, useFilter } from './Browser';
import { TEMPLATES } from '../data/templates';

export function LibraryPage({ lib, entries, onSave, onDelete, onToast }: { lib: Lib; entries: Record<string, LibData>; onSave: (id: string, d: LibData) => Promise<void>; onDelete: (id: string) => Promise<void>; onToast: (m: string) => void }) {
  const f = useFilter(lib.all);
  const [open, setOpen] = useState<Exercise | null>(null);
  const [video, setVideo] = useState('');
  const [form, setForm] = useState<{ id: string; c: CustomExercise; video: string } | null>(null);
  const [showTpl, setShowTpl] = useState(false);

  const openEx = (ex: Exercise) => { setOpen(ex); setVideo(entries[ex.id]?.video ?? ''); };
  const saveVideo = async () => {
    if (!open) return;
    const v = video.trim();
    if (v && !/^https:\/\//.test(v)) { onToast('https:// から始まるURLを入れてください'); return; }
    const cur = entries[open.id] ?? {};
    if (!v && !cur.custom) await onDelete(open.id);
    else await onSave(open.id, { ...cur, video: v || undefined });
    onToast(v ? '動画を設定しました' : '動画をはずしました');
    setOpen(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[13px] text-muted">全{lib.all.length}種類。金色の部分が「効くところ」です。先生が撮った動画を、どの運動にも差し込めます。</p>
        <div className="flex gap-2">
          <Button variant="soft" size="sm" onClick={() => setShowTpl(true)}>セット一覧</Button>
          <Button size="sm" onClick={() => setForm({ id: `c_${rid(8)}`, video: '', c: { name: '', areas: [], purpose: [], position: 'stand', level: 1, dose: { reps: 10, sets: 1, perDay: 1 }, target: '', steps: [''], points: [] } })}><Plus size={16} />院オリジナルを追加</Button>
        </div>
      </div>
      <Filters f={f} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {f.list.map((ex) => <ExCard key={ex.id} ex={ex} onOpen={() => openEx(ex)} />)}
      </div>

      <Modal
        open={!!open}
        onClose={() => setOpen(null)}
        title={open?.name}
        footer={open && (
          <div className="space-y-2">
            <label className="block text-[13px] font-bold"><Video size={14} className="mr-1 inline" />先生の動画（YouTubeの限定公開URLなど）</label>
            <div className="flex gap-2">
              <input className={inputCls} value={video} onChange={(e) => setVideo(e.target.value)} placeholder="https://youtu.be/…" />
              <Button onClick={saveVideo} disabled={(entries[open.id]?.video ?? '') === video.trim()}>保存</Button>
            </div>
            {video && !youtubeId(video) && !/\.(mp4|webm|mov)/i.test(video) && <p className="text-[12px] text-gold-700">YouTube以外のURLは「動画を開く」ボタンとして表示されます。</p>}
            {open.custom && (
              <div className="flex justify-between pt-1">
                <Button variant="soft" size="sm" onClick={() => { const d = entries[open.id]; if (d?.custom) { setForm({ id: open.id, c: d.custom, video: d.video ?? '' }); setOpen(null); } }}>内容を直す</Button>
                <Button variant="danger" size="sm" onClick={async () => { await onDelete(open.id); setOpen(null); onToast('削除しました'); }}>この運動を削除</Button>
              </div>
            )}
          </div>
        )}
      >
        {open && <ExerciseBody ex={open} doseLine={`標準：${doseText(open.dose)}`} />}
      </Modal>

      <Modal open={showTpl} onClose={() => setShowTpl(false)} title="セット（メニューの型）">
        <div className="space-y-3">
          {TEMPLATES.map((t) => (
            <div key={t.id} className="rounded-2xl border border-line p-3">
              <div className="font-bold text-brand">{t.name}</div>
              <div className="text-[13px] text-muted">{t.note}</div>
              <div className="mt-1 text-[13px]">{t.items.map((id) => EX_BY_ID[id]?.name).join('・')}</div>
            </div>
          ))}
          <p className="text-[12px] text-muted">メニュー作成画面の「セットから追加」で使えます。</p>
        </div>
      </Modal>

      {form && <CustomForm init={form} onClose={() => setForm(null)} onSave={async (id, d) => { await onSave(id, d); setForm(null); onToast('保存しました'); }} />}
    </div>
  );
}

function CustomForm({ init, onClose, onSave }: { init: { id: string; c: CustomExercise; video: string }; onClose: () => void; onSave: (id: string, d: LibData) => Promise<void> }) {
  const [c, setC] = useState<CustomExercise>(init.c);
  const [video, setVideo] = useState(init.video);
  const [busy, setBusy] = useState(false);
  const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const num = (v: string) => (v === '' ? undefined : Math.max(0, Math.round(Number(v)) || 0) || undefined);
  const ok = c.name.trim() && c.steps.some((s) => s.trim());
  return (
    <Modal open onClose={onClose} title="院オリジナルの運動" wide footer={<div className="flex justify-end gap-2"><Button variant="ghost" onClick={onClose}>やめる</Button><Button disabled={!ok || busy} onClick={async () => { setBusy(true); try { await onSave(init.id, { custom: { ...c, steps: c.steps.filter((s) => s.trim()), points: c.points.filter((s) => s.trim()) }, video: video.trim() || undefined }); } finally { setBusy(false); } }}>保存</Button></div>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-3">
          <Field label="運動の名前"><input className={inputCls} value={c.name} onChange={(e) => setC({ ...c, name: e.target.value })} maxLength={40} /></Field>
          <Field label="先生の動画URL（任意）" hint="YouTubeの限定公開がおすすめです。"><input className={inputCls} value={video} onChange={(e) => setVideo(e.target.value)} placeholder="https://youtu.be/…" /></Field>
          <Field label="動きの絵（任意）" hint="近い動きの運動を選ぶと、その人型アニメーションを使います。">
            <select className={inputCls} value={c.animFrom ?? ''} onChange={(e) => setC({ ...c, animFrom: e.target.value || undefined })}>
              <option value="">使わない（動画だけ）</option>
              {EXERCISES.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </Field>
          <Field label="効くところ"><input className={inputCls} value={c.target} onChange={(e) => setC({ ...c, target: e.target.value })} placeholder="例：お尻の横" /></Field>
          <div>
            <div className="mb-1 text-[13px] font-bold">部位</div>
            <div className="flex flex-wrap gap-1.5">{AREA_ORDER.map((a: Area) => <Chip key={a} on={c.areas.includes(a)} onClick={() => setC({ ...c, areas: toggle(c.areas, a) })}>{AREA_LABEL[a]}</Chip>)}</div>
          </div>
          <div>
            <div className="mb-1 text-[13px] font-bold">目的・姿勢・強さ</div>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(PURPOSE_LABEL) as Purpose[]).map((p) => <Chip key={p} on={c.purpose.includes(p)} onClick={() => setC({ ...c, purpose: toggle(c.purpose, p) })}>{PURPOSE_LABEL[p]}</Chip>)}
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {(Object.keys(POSITION_LABEL) as Position[]).map((p) => <Chip key={p} on={c.position === p} onClick={() => setC({ ...c, position: p })}>{POSITION_LABEL[p]}</Chip>)}
              <span className="w-2" />
              {([1, 2, 3] as const).map((l) => <Chip key={l} on={c.level === l} onClick={() => setC({ ...c, level: l })}>{['', 'やさしい', 'ふつう', 'しっかり'][l]}</Chip>)}
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-2 text-[12px] text-muted">
            {(['reps', 'hold', 'sets', 'perDay'] as const).map((k) => (
              <label key={k}>{{ reps: '回数', hold: 'キープ秒', sets: 'セット', perDay: '1日' }[k]}
                <input inputMode="numeric" className="h-10 w-full rounded-lg border border-sage-200 px-2 text-center" value={c.dose[k] ?? ''} onChange={(e) => setC({ ...c, dose: { ...c.dose, [k]: num(e.target.value) } })} />
              </label>
            ))}
          </div>
          <label className="flex items-center gap-2 text-[14px]"><input type="checkbox" className="h-5 w-5 accent-[#214d3d]" checked={!!c.dose.sides} onChange={(e) => setC({ ...c, dose: { ...c.dose, sides: e.target.checked } })} />左右それぞれ</label>
          <div>
            <div className="mb-1 text-[13px] font-bold">やり方（1行に1つ）</div>
            {c.steps.map((s, i) => (
              <div key={i} className="mb-1.5 flex gap-2"><span className="num mt-2.5 w-4 text-[13px] text-muted">{i + 1}</span><textarea rows={2} className={inputCls} value={s} onChange={(e) => setC({ ...c, steps: c.steps.map((x, j) => (j === i ? e.target.value : x)) })} /></div>
            ))}
            <Button variant="ghost" size="sm" onClick={() => setC({ ...c, steps: [...c.steps, ''] })}><Plus size={14} />手順を足す</Button>
          </div>
          <Field label="コツ（1行に1つ）"><textarea rows={3} className={inputCls} value={c.points.join('\n')} onChange={(e) => setC({ ...c, points: e.target.value.split('\n') })} /></Field>
          <Field label="注意（中止の目安など・任意）"><textarea rows={2} className={inputCls} value={c.caution ?? ''} onChange={(e) => setC({ ...c, caution: e.target.value || undefined })} /></Field>
          <p className="text-[12px] text-muted">回数の目安：{doseText(c.dose)}</p>
        </div>
      </div>
    </Modal>
  );
}
