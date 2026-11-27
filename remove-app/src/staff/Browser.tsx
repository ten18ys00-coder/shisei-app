// 運動を探す（部位・目的・姿勢・ことばで絞り込み）
import { useMemo, useState } from 'react';
import { Check, Plus, Search } from 'lucide-react';
import { AREA_LABEL, AREA_ORDER, POSITION_LABEL, PURPOSE_LABEL, type Area, type Exercise, type Position, type Purpose } from '../data/exercises';
import { Figure } from '../components/Figure';
import { Chip } from '../components/ui';
import { hasAnim } from '../lib/library';
import { doseText } from '../lib/util';
import { PlayCircle } from 'lucide-react';

export function useFilter(all: Exercise[]) {
  const [area, setArea] = useState<Area | null>(null);
  const [purpose, setPurpose] = useState<Purpose | null>(null);
  const [pos, setPos] = useState<Position | null>(null);
  const [q, setQ] = useState('');
  const list = useMemo(() => {
    const qq = q.trim();
    return all.filter((e) =>
      (!area || e.areas.includes(area)) && (!purpose || e.purpose.includes(purpose)) && (!pos || e.position === pos) &&
      (!qq || (e.name + e.target + e.steps.join('')).includes(qq)));
  }, [all, area, purpose, pos, q]);
  return { area, setArea, purpose, setPurpose, pos, setPos, q, setQ, list };
}

export function Filters({ f }: { f: ReturnType<typeof useFilter> }) {
  return (
    <div className="space-y-2">
      <div className="relative">
        <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input value={f.q} onChange={(e) => f.setQ(e.target.value)} placeholder="運動の名前・効くところで探す" className="h-11 w-full rounded-xl border border-sage-200 bg-white pl-9 pr-3 focus:border-brand focus:outline-none" />
      </div>
      <div className="scroll-x -mx-1 flex gap-1.5 px-1 pb-0.5">
        <Chip on={!f.area} onClick={() => f.setArea(null)}>すべての部位</Chip>
        {AREA_ORDER.map((a) => <Chip key={a} on={f.area === a} onClick={() => f.setArea(f.area === a ? null : a)}>{AREA_LABEL[a]}</Chip>)}
      </div>
      <div className="scroll-x -mx-1 flex gap-1.5 px-1 pb-0.5">
        {(Object.keys(PURPOSE_LABEL) as Purpose[]).map((p) => <Chip key={p} on={f.purpose === p} onClick={() => f.setPurpose(f.purpose === p ? null : p)}>{PURPOSE_LABEL[p]}</Chip>)}
        <span className="mx-1 w-px shrink-0 bg-line" />
        {(Object.keys(POSITION_LABEL) as Position[]).map((p) => <Chip key={p} on={f.pos === p} onClick={() => f.setPos(f.pos === p ? null : p)}>{POSITION_LABEL[p]}</Chip>)}
      </div>
    </div>
  );
}

export function ExCard({ ex, onOpen, onAdd, added, animate = true }: { ex: Exercise; onOpen: () => void; onAdd?: () => void; added?: number; animate?: boolean }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-line bg-white">
      <button type="button" onClick={onOpen} className="fig-bg relative block">
        {hasAnim(ex) ? (
          <Figure anim={ex.anim} playing={animate} fps={20} className="block aspect-[4/3] w-full" />
        ) : (
          <div className="grid aspect-[4/3] w-full place-items-center text-sage"><PlayCircle size={36} /></div>
        )}
        {ex.video && <span className="absolute left-2 top-2 rounded-full bg-gold px-2 py-0.5 text-[11px] font-bold text-white">動画あり</span>}
        {ex.custom && <span className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-bold text-gold-700">院オリジナル</span>}
      </button>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <button type="button" onClick={onOpen} className="text-left text-[14px] font-bold leading-snug text-ink">{ex.name}</button>
        <div className="text-[12px] text-muted">{doseText(ex.dose, { perDay: false })}</div>
        {onAdd && (
          <button type="button" onClick={onAdd} className={`mt-auto flex h-9 items-center justify-center gap-1 rounded-lg text-[13px] font-bold ${added ? 'bg-brand text-white' : 'bg-brand-50 text-brand hover:bg-brand-100'}`}>
            {added ? <><Check size={15} />追加ずみ{added > 1 ? `（${added}）` : ''}</> : <><Plus size={15} />メニューに追加</>}
          </button>
        )}
      </div>
    </div>
  );
}
