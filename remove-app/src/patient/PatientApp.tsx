// 患者さんの画面（リンクで開く。ログイン不要）
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronRight, CloudOff, MessageCircle, Phone, PlusSquare, RefreshCw, Share } from 'lucide-react';
import type { PatientBackend } from '../lib/backend';
import { buildLib } from '../lib/library';
import type { LogRow, PatientView } from '../types';
import { doseText, mdLabel, storage, todayJST, weekday } from '../lib/util';
import { Figure } from '../components/Figure';
import { DoseText } from '../components/ExerciseView';
import { Logo, Wordmark } from '../components/ui';
import { Calendar, summarize } from '../components/Records';
import { Player } from './Player';
import { hasAnim } from '../lib/library';
import { APP_BY, APP_TAGLINE, CLINIC_LINKS } from '../config';

const PENDING_KEY = 'hosaka-selfcare-pending';
const PAIN_FACE = ['とても楽', '', '', '', '', 'ふつう', '', '', '', '', 'とても痛い'];

function painColor(p: number) {
  const c = ['#214d3d', '#2b604c', '#3d7560', '#5f8a74', '#8aa58f', '#c2b07d', '#d4a35a', '#d48a4a', '#cc6e45', '#bd5340', '#a63d3a'];
  return c[Math.max(0, Math.min(10, p))];
}

export function PatientApp({ token, backend, preview }: { token: string; backend: PatientBackend; preview?: boolean }) {
  const [view, setView] = useState<PatientView | null | undefined>(undefined);
  const [err, setErr] = useState<string | null>(null);
  const [today, setToday] = useState(todayJST());
  const [done, setDone] = useState<string[]>([]);
  const [pain, setPain] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'offline'>('idle');
  const [open, setOpen] = useState<string | null>(null);
  const [showA2HS, setShowA2HS] = useState(false);
  const timer = useRef<number | null>(null);
  const latest = useRef({ done, pain, note });
  latest.current = { done, pain, note };

  const load = useCallback(async () => {
    setErr(null);
    try {
      const v = await backend.view(token);
      setView(v);
      if (v) {
        const t = todayJST();
        setToday(t);
        const mine = pendingFor(token, t) ?? v.logs.find((l) => l.day === t);
        setDone(mine?.done ?? []);
        setPain(mine?.pain ?? null);
        setNote(mine?.note ?? '');
        if (!preview) storage.set('hosaka-selfcare-last', token);
        document.title = `${v.label}の運動メニュー｜Re:MOVE`;
      }
    } catch (e) {
      setErr((e as Error).message);
    }
  }, [backend, token, preview]);

  useEffect(() => { load(); }, [load]);

  const flush = useCallback(async () => {
    if (preview || !view) return;
    const row = { day: today, done: latest.current.done, total: view.plan.items.length, pain: latest.current.pain, note: latest.current.note.slice(0, 500) };
    setSaveState('saving');
    try {
      await backend.log(token, row);
      clearPending(token, today);
      setSaveState('saved');
    } catch {
      setPending(token, { ...row, patient_id: '' });
      setSaveState('offline');
    }
  }, [backend, token, today, view, preview]);

  const schedule = useCallback((ms = 700) => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => { timer.current = null; flush(); }, ms);
  }, [flush]);

  // 通信が戻ったら送り直す
  useEffect(() => {
    const retry = () => { if (pendingFor(token, today)) flush(); };
    window.addEventListener('online', retry);
    document.addEventListener('visibilitychange', retry);
    return () => { window.removeEventListener('online', retry); document.removeEventListener('visibilitychange', retry); };
  }, [flush, token, today]);

  const lib = useMemo(() => buildLib(view?.library ?? {}), [view]);
  const logs: LogRow[] = useMemo(() => {
    if (!view) return [];
    const others = view.logs.filter((l) => l.day !== today);
    return [...others, { patient_id: '', day: today, done, total: view.plan.items.length, pain, note }];
  }, [view, today, done, pain, note]);
  const s = useMemo(() => summarize(logs, today), [logs, today]);

  const standalone = typeof window !== 'undefined' && (window.matchMedia?.('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone);
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

  if (view === undefined && !err) {
    return <div className="grid min-h-[100dvh] place-items-center"><div className="flex flex-col items-center gap-3 text-muted"><Logo size={56} /><Wordmark className="text-[26px]" /><span className="text-[13px]">読み込み中…</span></div></div>;
  }
  if (err) {
    return (
      <div className="grid min-h-[100dvh] place-items-center px-6 text-center">
        <div>
          <CloudOff size={40} className="mx-auto text-sage" />
          <p className="mt-3 font-bold">メニューを読み込めませんでした</p>
          <p className="mt-1 text-[14px] text-muted">通信状態を確認して、もう一度お試しください。</p>
          <button type="button" onClick={load} className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-brand px-5 py-2.5 font-bold text-white"><RefreshCw size={16} />もう一度</button>
        </div>
      </div>
    );
  }
  if (!view) {
    return (
      <div className="grid min-h-[100dvh] place-items-center px-6 text-center">
        <div>
          <Logo size={48} />
          <p className="mt-3 font-bold">このリンクは使えません</p>
          <p className="mt-1 text-[14px] leading-relaxed text-muted">メニューが新しくなったか、運動の期間が終わった可能性があります。<br />お手数ですが、院にお問い合わせください。</p>
          <a href="tel:028-666-6141" className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-brand px-5 py-2.5 font-bold text-white"><Phone size={16} />ほさか整骨院に電話</a>
        </div>
      </div>
    );
  }

  const items = view.plan.items.filter((i) => lib.byId[i.exId]);
  const doneCount = items.filter((i) => done.includes(i.id)).length;
  const all = items.length > 0 && doneCount === items.length;
  const toggle = (id: string, v?: boolean) => {
    setDone((d) => {
      const on = v ?? !d.includes(id);
      return on ? (d.includes(id) ? d : [...d, id]) : d.filter((x) => x !== id);
    });
    schedule();
  };
  const openItem = items.find((i) => i.id === open);
  const line = CLINIC_LINKS[view.clinic.code]?.line;
  const pct = items.length ? doneCount / items.length : 0;

  return (
    <div className="mx-auto min-h-[100dvh] max-w-xl bg-white pb-10">
      <header className="safe-t bg-brand px-5 pb-6 pt-4 text-white">
        <div className="flex items-center gap-2 text-[13px]"><Logo size={26} /><Wordmark light className="text-[17px]" /><span className="text-[11px] opacity-75">{view.clinic.name}</span><span className="ml-auto num opacity-90">{mdLabel(today)}（{weekday(today)}）</span></div>
        <h1 className="mt-3 font-serif text-[22px] font-bold leading-snug [text-wrap:balance]">{view.label}<span className="whitespace-nowrap">の運動メニュー</span></h1>
        {view.plan.title && <div className="mt-0.5 text-[14px] opacity-85">{view.plan.title}</div>}
        <div className="mt-4 flex items-center gap-4">
          <svg viewBox="0 0 44 44" className="h-16 w-16 shrink-0 -rotate-90">
            <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(255,255,255,.18)" strokeWidth="5" />
            <circle cx="22" cy="22" r="18" fill="none" stroke="#d9b56c" strokeWidth="5" strokeLinecap="round" strokeDasharray={`${(pct * 113.1).toFixed(1)} 113.1`} style={{ transition: 'stroke-dasharray .5s' }} />
          </svg>
          <div>
            <div className="text-[13px] opacity-85">今日のメニュー</div>
            <div className="num font-serif text-[26px] font-bold leading-none">{doneCount}<span className="text-[16px] opacity-80"> / {items.length}</span></div>
            <div className="mt-1 text-[12px] opacity-85">{s.streak > 0 ? `${s.streak}日連続でできています` : 'できたらチェックしましょう'}</div>
          </div>
        </div>
      </header>

      {view.plan.message && (
        <div className="mx-4 -mt-3 rounded-2xl border border-beige-200 bg-beige-50 px-4 py-3 text-[14px] leading-relaxed shadow-sm">
          <div className="mb-0.5 text-[12px] font-bold text-gold-700">先生から</div>{view.plan.message}
        </div>
      )}

      <main className="mt-4 space-y-3 px-4">
        {items.length === 0 && <p className="rounded-2xl bg-beige-50 px-4 py-8 text-center text-muted">メニューを準備中です。次回の来院時にお渡しします。</p>}
        {items.map((it, i) => {
          const ex = lib.byId[it.exId];
          const isDone = done.includes(it.id);
          return (
            <div key={it.id} className={`flex items-stretch overflow-hidden rounded-2xl border transition-colors ${isDone ? 'border-brand-100 bg-brand-50/60' : 'border-line bg-white'}`}>
              <button type="button" onClick={() => setOpen(it.id)} className="flex min-w-0 flex-1 items-center gap-3 p-2.5 text-left">
                <div className="fig-bg relative h-[76px] w-[100px] shrink-0 overflow-hidden rounded-xl">
                  {hasAnim(ex) ? <Figure anim={ex.anim} fps={20} startAt={i * 0.7} className="h-full w-full" /> : <div className="grid h-full place-items-center text-[12px] text-sage">動画</div>}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[15px] font-bold leading-snug">{ex.name}</div>
                  <div className="mt-0.5 text-[13px] font-bold text-brand"><DoseText text={doseText(it)} /></div>
                  {it.note && <div className="truncate text-[12px] text-gold-700">{it.note}</div>}
                  <div className="mt-0.5 flex items-center text-[12px] text-muted">一緒にやる<ChevronRight size={14} /></div>
                </div>
              </button>
              <button type="button" onClick={() => toggle(it.id)} className="flex w-16 shrink-0 flex-col items-center justify-center gap-0.5 border-l border-line/70" aria-pressed={isDone} aria-label={isDone ? 'できたを取り消す' : 'できた'}>
                <span className={`grid h-9 w-9 place-items-center rounded-full border-2 ${isDone ? 'pop border-brand bg-brand text-white' : 'border-sage-200 text-transparent'}`}><Check size={20} strokeWidth={3} /></span>
                <span className={`text-[11px] font-bold ${isDone ? 'text-brand' : 'text-muted'}`}>できた</span>
              </button>
            </div>
          );
        })}

        {all && <div className="pop rounded-2xl bg-gold-100 px-4 py-3 text-center font-bold text-gold-700">今日のメニュー、全部できました！</div>}

        {items.length > 0 && (
          <section className="rounded-2xl border border-line p-4">
            <h2 className="font-bold">今日のからだの調子</h2>
            <p className="text-[12px] text-muted">いちばん気になるところの痛み・つらさは？（0＝なし、10＝とても強い）</p>
            <div className="mt-3 grid grid-cols-11 gap-1">
              {Array.from({ length: 11 }, (_, n) => (
                <button key={n} type="button" onClick={() => { setPain(pain === n ? null : n); schedule(300); }} className={`num aspect-square rounded-lg text-[14px] font-bold ${pain === n ? 'text-white' : 'bg-beige-50 text-ink'}`} style={pain === n ? { background: painColor(n) } : undefined}>{n}</button>
              ))}
            </div>
            <div className="mt-1 flex justify-between text-[11px] text-muted"><span>{PAIN_FACE[0]}</span><span>{PAIN_FACE[5]}</span><span>{PAIN_FACE[10]}</span></div>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} onBlur={() => schedule(100)} rows={2} maxLength={500} placeholder="先生へのひとこと（任意）例：階段が少し楽になった" className="mt-3 w-full rounded-xl border border-sage-200 px-3 py-2.5 focus:border-brand focus:outline-none" />
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="text-[12px] text-muted">
                {saveState === 'saving' && '送信中…'}
                {saveState === 'saved' && <span className="font-bold text-brand">✓ 院に届きました</span>}
                {saveState === 'offline' && <span className="text-gold-700">通信できるようになったら自動で送ります</span>}
              </span>
              <button type="button" onClick={() => flush()} className="rounded-full bg-brand px-4 py-2 text-[14px] font-bold text-white">記録を送る</button>
            </div>
          </section>
        )}

        <section className="rounded-2xl border border-line p-4">
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="font-bold">これまでの記録</h2>
            <span className="text-[12px] text-muted">この7日で <b className="num text-brand">{s.doneDays7}</b> 日</span>
          </div>
          <Calendar logs={logs} today={today} />
        </section>

        {!standalone && !preview && (
          <section className="rounded-2xl bg-beige-50 p-4">
            <button type="button" onClick={() => setShowA2HS((v) => !v)} className="flex w-full items-center gap-2 text-left font-bold text-brand"><PlusSquare size={18} />ホーム画面に追加すると、アプリのように開けます</button>
            {showA2HS && (
              <ol className="mt-2 space-y-1 text-[14px]">
                {isIOS ? (
                  <><li>1. 画面下の <Share size={14} className="inline" />（共有）をタップ</li><li>2.「ホーム画面に追加」をタップ</li><li>3. 右上の「追加」をタップ</li></>
                ) : (
                  <><li>1. 右上の「︙」（メニュー）をタップ</li><li>2.「ホーム画面に追加」または「アプリをインストール」をタップ</li></>
                )}
              </ol>
            )}
          </section>
        )}

        <section className="space-y-2 rounded-2xl border border-line p-4 text-[13px] text-muted">
          <p>痛みやしびれが強くなる運動はお休みして、次回の来院時に先生へお伝えください。いつもと違う強い痛みがあるときは、運動をせずにご連絡ください。</p>
          <div className="flex flex-wrap gap-2 pt-1">
            {view.clinic.tel && <a href={`tel:${view.clinic.tel}`} className="inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-2 font-bold text-brand"><Phone size={15} />電話</a>}
            {line && <a href={line} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-2 font-bold text-brand"><MessageCircle size={15} />LINEで相談・予約</a>}
          </div>
        </section>
        <div className="pt-3 text-center">
          <Wordmark className="text-[18px]" />
          <div className="font-serif text-[12px] text-muted">{APP_TAGLINE}</div>
          <div className="mt-1 text-[11px] tracking-wider text-sage">{APP_BY}　{view.clinic.name}</div>
        </div>
      </main>

      {openItem && (
        <Player
          ex={lib.byId[openItem.exId]}
          item={openItem}
          done={done.includes(openItem.id)}
          onDone={() => toggle(openItem.id, true)}
          onClose={() => setOpen(null)}
        />
      )}
    </div>
  );
}

// 送れなかった記録を端末に置いておく
function pendingAll(): Record<string, LogRow> {
  try { return JSON.parse(storage.get(PENDING_KEY) ?? '{}'); } catch { return {}; }
}
function pendingFor(token: string, day: string): LogRow | undefined { return pendingAll()[`${token}:${day}`]; }
function setPending(token: string, row: LogRow) { const a = pendingAll(); a[`${token}:${row.day}`] = row; storage.set(PENDING_KEY, JSON.stringify(a)); }
function clearPending(token: string, day: string) { const a = pendingAll(); delete a[`${token}:${day}`]; storage.set(PENDING_KEY, JSON.stringify(a)); }
