// 一緒にやる画面：人型アニメーションに合わせて回数・秒数を数える
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Anim } from '../figure/model';
import { Check, ChevronLeft, Info, Pause, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import type { Exercise } from '../data/exercises';
import type { PlanItem } from '../types';
import { Figure } from '../components/Figure';
import { ExerciseBody, VideoEmbed } from '../components/ExerciseView';
import { hasAnim } from '../lib/library';
import { doseText, storage } from '../lib/util';

type Phase = 'ready' | 'work' | 'switch' | 'rest' | 'done';

let ctx: AudioContext | null = null;
function beep(freq = 880, ms = 90, vol = 0.08) {
  try {
    ctx ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = freq;
    o.type = 'sine';
    g.gain.value = vol;
    o.connect(g); g.connect(ctx.destination);
    const t = ctx.currentTime;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + ms / 1000);
    o.start(t); o.stop(t + ms / 1000 + 0.02);
  } catch { /* 音が出せない端末 */ }
}

/** 処方のキープ秒数に合わせて、アニメーションの止まる時間を変える */
function fitHold(anim: Anim, item: PlanItem): Anim {
  const hold = item.hold ?? (item.reps ? undefined : item.seconds);
  if (!hold || anim.keys.length < 2) return anim;
  let idx = 0;
  anim.keys.forEach((k, i) => { if ((k.hold ?? 0) > (anim.keys[idx].hold ?? 0)) idx = i; });
  const cur = anim.keys[idx].hold ?? 0;
  if (cur < 1) return anim; // 止まらない運動（足踏みなど）はそのまま
  const target = item.reps ? Math.max(cur, hold) : Math.max(cur, hold + 0.5);
  return { ...anim, keys: anim.keys.map((k, i) => (i === idx ? { ...k, hold: target } : k)) };
}

export function Player({ ex, item, done, onDone, onClose }: { ex: Exercise; item: PlanItem; done: boolean; onDone: () => void; onClose: () => void }) {
  const anim = useMemo(() => fitHold(ex.anim, item), [ex.anim, item]);
  const sets = Math.max(1, item.sets ?? 1);
  const sides = item.sides ? 2 : 1;
  const mode: 'reps' | 'time' = item.reps ? 'reps' : 'time';
  const timeTarget = item.seconds ?? item.hold ?? 20;
  const [phase, setPhase] = useState<Phase>('ready');
  const [setNo, setSetNo] = useState(1);
  const [side, setSide] = useState(1);
  const [rep, setRep] = useState(0);
  const [left, setLeft] = useState(timeTarget);
  const [rest, setRest] = useState(0);
  const [cue, setCue] = useState<string | undefined>();
  const [slow, setSlow] = useState(false);
  const [sound, setSound] = useState(() => storage.get('hosaka-selfcare-sound') !== 'off');
  const [info, setInfo] = useState(false);
  const [figKey, setFigKey] = useState(0);
  const soundRef = useRef(sound);
  soundRef.current = sound;

  const finishUnit = useCallback(() => {
    // 片側・1セットが終わったとき
    if (side < sides) {
      setPhase('switch');
      if (soundRef.current) beep(660, 160);
      return;
    }
    if (setNo < sets) {
      setPhase('rest');
      setRest(20);
      if (soundRef.current) beep(660, 160);
      return;
    }
    setPhase('done');
    if (soundRef.current) { beep(784, 120); setTimeout(() => beep(1046, 220), 140); }
    onDone();
  }, [side, sides, setNo, sets, onDone]);

  // 回数モード：アニメーション1周＝1回
  const onCycle = useCallback(() => {
    if (phase !== 'work' || mode !== 'reps') return;
    setRep((r) => {
      const n = r + 1;
      if (soundRef.current) beep(n >= (item.reps ?? 10) ? 988 : 880, 80);
      if (n >= (item.reps ?? 10)) setTimeout(finishUnit, 50);
      return n;
    });
  }, [phase, mode, item.reps, finishUnit]);

  // 秒数モード
  useEffect(() => {
    if (phase !== 'work' || mode !== 'time') return;
    const t = setInterval(() => {
      setLeft((s) => {
        if (s <= 1) { clearInterval(t); setTimeout(finishUnit, 50); return 0; }
        if (s <= 4 && soundRef.current) beep(740, 60);
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [phase, mode, finishUnit]);

  // 休憩
  useEffect(() => {
    if (phase !== 'rest') return;
    const t = setInterval(() => setRest((s) => {
      if (s <= 1) { clearInterval(t); nextSet(); return 0; }
      return s - 1;
    }), 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const startUnit = () => { setRep(0); setLeft(timeTarget); setFigKey((k) => k + 1); setPhase('work'); if (soundRef.current) beep(880, 60); };
  const nextSide = () => { setSide((s) => s + 1); startUnit(); };
  const nextSet = () => { setSetNo((n) => n + 1); setSide(1); startUnit(); };
  const restart = () => { setSetNo(1); setSide(1); setRep(0); setLeft(timeTarget); setPhase('ready'); setFigKey((k) => k + 1); };

  const big = mode === 'reps' ? `${rep}` : `${left}`;
  const unit = mode === 'reps' ? `/ ${item.reps}回` : '秒';
  const sub = [sets > 1 ? `${setNo}/${sets}セット目` : '', sides > 1 ? (side === 1 ? '片側（1回目）' : '反対側') : ''].filter(Boolean).join('　');

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <div className="safe-t flex items-center gap-2 border-b border-line px-3 py-2">
        <button type="button" onClick={onClose} className="flex items-center gap-0.5 rounded-lg px-1.5 py-1.5 font-bold text-brand"><ChevronLeft size={20} />もどる</button>
        <div className="min-w-0 flex-1 truncate text-center text-[15px] font-bold">{ex.name}</div>
        <button type="button" onClick={() => { const v = !sound; setSound(v); storage.set('hosaka-selfcare-sound', v ? 'on' : 'off'); }} className="grid h-10 w-10 place-items-center rounded-full text-muted" aria-label={sound ? '音を消す' : '音を出す'}>{sound ? <Volume2 size={20} /> : <VolumeX size={20} />}</button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="fig-bg relative">
          {hasAnim(ex) ? (
            <Figure key={figKey} anim={anim} playing={phase !== 'rest' && phase !== 'switch'} speed={slow ? 0.7 : 1} onCycle={onCycle} onCue={setCue} mirror={side === 2} className="mx-auto block aspect-[4/3] max-h-[46dvh] w-full" />
          ) : ex.video ? (
            <div className="p-3"><VideoEmbed url={ex.video} title={ex.name} /></div>
          ) : null}
          {cue && phase === 'work' && hasAnim(ex) && <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center"><span className="rounded-full bg-white/90 px-4 py-1.5 text-[15px] font-bold text-brand shadow-sm">{cue}</span></div>}
          {(phase === 'rest' || phase === 'switch') && (
            <div className="absolute inset-0 grid place-items-center bg-white/80 backdrop-blur-[2px]">
              <div className="text-center">
                {phase === 'rest' ? (
                  <>
                    <div className="text-[14px] text-muted">ひと休み</div>
                    <div className="num font-serif text-[56px] font-bold text-brand">{rest}</div>
                    <button type="button" onClick={nextSet} className="rounded-full bg-brand px-5 py-2 font-bold text-white">次のセットへ</button>
                  </>
                ) : (
                  <>
                    <div className="mb-3 text-[20px] font-bold text-brand">反対側もやりましょう</div>
                    <button type="button" onClick={nextSide} className="rounded-full bg-brand px-6 py-3 text-[16px] font-bold text-white">反対側スタート</button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="px-5 pt-4">
          <div className="text-center">
            {phase === 'done' ? (
              <div className="pop py-2">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand text-white"><Check size={36} strokeWidth={3} /></div>
                <div className="mt-2 font-serif text-[22px] font-bold text-brand">おつかれさまでした！</div>
                <div className="text-[13px] text-muted">記録にチェックしました</div>
              </div>
            ) : (
              <>
                <div className="flex items-baseline justify-center gap-1.5">
                  <span className="num font-serif text-[64px] font-bold leading-none text-ink">{phase === 'ready' ? (mode === 'reps' ? '0' : timeTarget) : big}</span>
                  <span className="text-[18px] text-muted">{unit}</span>
                </div>
                <div className="mt-1 h-5 text-[13px] text-muted">{sub}</div>
              </>
            )}
          </div>
          <div className="mt-2 rounded-xl bg-brand-50 px-4 py-2 text-center text-[14px] font-bold text-brand">{doseText(item)}</div>
          {item.note && <div className="mt-2 rounded-xl bg-gold-100 px-4 py-2 text-[14px] text-gold-700"><b>先生から：</b>{item.note}</div>}
          <button type="button" onClick={() => setInfo((v) => !v)} className="mt-3 flex items-center gap-1 text-[14px] font-bold text-brand"><Info size={16} />{info ? 'やり方を閉じる' : 'やり方・コツを見る'}</button>
          {info && <div className="mt-2 pb-4"><ExerciseBody ex={ex} showFigure={false} /></div>}
          <div className="h-28" />
        </div>
      </div>

      <div className="safe-b border-t border-line bg-white px-4 pt-3">
        {phase === 'ready' && (
          <div className="flex gap-2">
            <button type="button" onClick={() => setSlow((v) => !v)} className={`h-14 rounded-2xl border px-4 text-[14px] font-bold ${slow ? 'border-brand bg-brand-50 text-brand' : 'border-line text-muted'}`}>ゆっくり</button>
            <button type="button" onClick={startUnit} className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-brand text-[18px] font-bold text-white"><Play size={22} fill="currentColor" />一緒にスタート</button>
          </div>
        )}
        {phase === 'work' && (
          <div className="flex gap-2">
            <button type="button" onClick={() => setPhase('ready')} className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl border border-line text-[16px] font-bold text-muted"><Pause size={20} />とめる</button>
            <button type="button" onClick={finishUnit} className="h-14 rounded-2xl bg-brand-50 px-5 text-[15px] font-bold text-brand">終わった</button>
          </div>
        )}
        {(phase === 'rest' || phase === 'switch') && <div className="h-14" />}
        {phase === 'done' && (
          <div className="flex gap-2">
            <button type="button" onClick={restart} className="flex h-14 items-center gap-1 rounded-2xl border border-line px-4 font-bold text-muted"><RotateCcw size={18} />もう一度</button>
            <button type="button" onClick={onClose} className="h-14 flex-1 rounded-2xl bg-brand text-[17px] font-bold text-white">次の運動へ</button>
          </div>
        )}
        {phase === 'ready' && !done && <button type="button" onClick={() => { onDone(); onClose(); }} className="mt-2 w-full py-1.5 text-[13px] text-muted underline underline-offset-2">数えずに「できた」にする</button>}
      </div>
    </div>
  );
}
