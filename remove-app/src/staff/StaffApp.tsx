// 先生・スタッフ用の画面
import { useCallback, useEffect, useMemo, useState } from 'react';
import { BookOpen, HelpCircle, LogOut, RefreshCw, Users } from 'lucide-react';
import type { StaffBackend } from '../lib/backend';
import { DemoPatient, PreviewPatient, CloudPatient, resetDemo, supabase } from '../lib/backend';
import { buildLib } from '../lib/library';
import type { LibData, LogRow, Patient } from '../types';
import { addDays, todayJST } from '../lib/util';
import { Logo, Toast, Wordmark } from '../components/ui';
import { PatientList } from './PatientList';
import { PatientDetail } from './PatientDetail';
import { LibraryPage } from './LibraryPage';
import { PrintSheet } from './Handoff';
import { PatientApp } from '../patient/PatientApp';
import { APP_BY, APP_NAME, APP_VERSION } from '../config';
import { Help } from './Help';

type Page = 'patients' | 'library' | 'help';

export function StaffApp({ backend }: { backend: StaffBackend }) {
  const [page, setPage] = useState<Page>('patients');
  const [patients, setPatients] = useState<Patient[] | null>(null);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [entries, setEntries] = useState<Record<string, LibData>>({});
  const [openId, setOpenId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<Patient | null>(null);
  const [printing, setPrinting] = useState<Patient | null>(null);

  const loadAll = useCallback(async () => {
    try {
      const [p, l, lib] = await Promise.all([backend.listPatients(), backend.listLogs(addDays(todayJST(), -90)), backend.listLibrary()]);
      setPatients(p); setLogs(l); setEntries(Object.fromEntries(lib.map((e) => [e.id, e.data])));
      setError(null);
    } catch (e) { setError((e as Error).message); }
  }, [backend]);

  useEffect(() => { loadAll(); }, [loadAll]);
  // 姿勢アプリの「Re:MOVEで渡す」から来たとき：その患者さんを開く
  useEffect(() => {
    const open = () => {
      const m = location.hash.match(/^#p=([0-9a-zA-Z-]{3,64})$/);
      if (m) { setPage('patients'); setOpenId(m[1]); history.replaceState(null, '', location.pathname + location.search); loadAll(); }
    };
    open();
    window.addEventListener('hashchange', open);
    return () => window.removeEventListener('hashchange', open);
  }, [loadAll]);
  useEffect(() => {
    let t: number | null = null;
    const off = backend.subscribe(() => {
      if (t) window.clearTimeout(t);
      t = window.setTimeout(async () => {
        try {
          const [p, l] = await Promise.all([backend.listPatients(), backend.listLogs(addDays(todayJST(), -90))]);
          setPatients(p); setLogs(l);
        } catch { /* 次の更新で */ }
      }, 400);
    });
    return () => { off(); if (t) window.clearTimeout(t); };
  }, [backend]);

  const lib = useMemo(() => buildLib(entries), [entries]);
  const logsBy = useMemo(() => {
    const m = new Map<string, LogRow[]>();
    for (const l of logs) { const a = m.get(l.patient_id) ?? []; a.push(l); m.set(l.patient_id, a); }
    return m;
  }, [logs]);

  const run = async <T,>(job: () => Promise<T>): Promise<T | undefined> => {
    try { return await job(); } catch (e) { setToast((e as Error).message); return undefined; }
  };

  const current = patients?.find((p) => p.id === openId) ?? null;

  useEffect(() => {
    if (!printing) return;
    const t = setTimeout(() => { window.print(); }, 350);
    const after = () => setPrinting(null);
    window.addEventListener('afterprint', after);
    return () => { clearTimeout(t); window.removeEventListener('afterprint', after); };
  }, [printing]);

  const patientBackend = useMemo(() => new PreviewPatient(backend.kind === 'demo' ? new DemoPatient() : new CloudPatient()), [backend.kind]);

  return (
    <>
      <div className="no-print min-h-[100dvh] bg-white">
        <header className="safe-t sticky top-0 z-20 border-b border-line bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-2.5">
            <Logo size={34} />
            <div className="min-w-0 leading-tight">
              <div className="text-[20px] leading-none"><Wordmark /></div>
              <div className="mt-0.5 text-[11px] text-muted"><span className="font-display font-semibold tracking-wider">{APP_BY}</span>　運動処方{backend.kind === 'demo' && <span className="ml-1 rounded bg-gold px-1.5 py-px font-bold text-white">お試し版</span>}</div>
            </div>
            <nav className="ml-auto hidden gap-1 sm:flex">
              <NavBtn on={page === 'patients'} onClick={() => { setPage('patients'); setOpenId(null); }} icon={<Users size={17} />}>患者さん</NavBtn>
              <NavBtn on={page === 'library'} onClick={() => setPage('library')} icon={<BookOpen size={17} />}>運動ライブラリ</NavBtn>
              <NavBtn on={page === 'help'} onClick={() => setPage('help')} icon={<HelpCircle size={17} />}>使い方</NavBtn>
            </nav>
            {backend.kind === 'cloud' ? (
              <button type="button" title="ログアウト" onClick={() => supabase().auth.signOut()} className="grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-beige sm:ml-1"><LogOut size={18} /></button>
            ) : (
              <button type="button" title="お試しデータを最初に戻す" onClick={() => { resetDemo(); setOpenId(null); loadAll(); setToast('お試しデータを最初に戻しました'); }} className="ml-auto grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-beige sm:ml-1"><RefreshCw size={17} /></button>
            )}
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-4 pb-28 pt-4">
          {error && (
            <div className="mb-3 flex items-center justify-between gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[14px] text-rose-800">
              <span>{error}</span>
              <button type="button" onClick={loadAll} className="shrink-0 font-bold underline">再読み込み</button>
            </div>
          )}
          {page === 'patients' && (
            patients === null ? <div className="py-20 text-center text-muted">読み込み中…</div> : current ? (
              <PatientDetail
                key={current.id}
                patient={current}
                logs={logsBy.get(current.id) ?? []}
                lib={lib}
                onBack={() => setOpenId(null)}
                onUpdate={async (patch) => { const p = await run(() => backend.updatePatient(current.id, patch)); if (p) setPatients((ps) => ps?.map((x) => (x.id === p.id ? p : x)) ?? null); }}
                onDelete={async () => { await run(() => backend.deletePatient(current.id)); setPatients((ps) => ps?.filter((x) => x.id !== current.id) ?? null); }}
                onToast={setToast}
                onPreview={() => setPreview(current)}
                loadPosture={(id) => backend.listPosture(id)}
                onPrint={() => setPrinting(current)}
              />
            ) : (
              <PatientList
                patients={patients}
                logsBy={logsBy}
                onOpen={setOpenId}
                onCreate={async (label, memo) => {
                  const p = await run(() => backend.createPatient(label, memo));
                  if (p) { setPatients((ps) => [p, ...(ps ?? [])]); setOpenId(p.id); }
                }}
              />
            )
          )}
          {page === 'library' && (
            <LibraryPage
              lib={lib}
              entries={entries}
              onToast={setToast}
              onSave={async (id, d) => { await run(() => backend.saveLibrary(id, d)); setEntries((e) => ({ ...e, [id]: d })); }}
              onDelete={async (id) => { await run(() => backend.deleteLibrary(id)); setEntries((e) => { const n = { ...e }; delete n[id]; return n; }); }}
            />
          )}
          {page === 'help' && <Help demo={backend.kind === 'demo'} />}
          <p className="mt-10 text-center text-[11px] text-sage">{APP_NAME}　{APP_BY}　{APP_VERSION}</p>
        </main>

        <nav className="safe-b fixed inset-x-0 bottom-0 z-20 flex border-t border-line bg-white/95 pt-1 backdrop-blur sm:hidden">
          <TabBtn on={page === 'patients'} onClick={() => { setPage('patients'); if (page === 'patients') setOpenId(null); }} icon={<Users size={22} />}>患者さん</TabBtn>
          <TabBtn on={page === 'library'} onClick={() => setPage('library')} icon={<BookOpen size={22} />}>ライブラリ</TabBtn>
          <TabBtn on={page === 'help'} onClick={() => setPage('help')} icon={<HelpCircle size={22} />}>使い方</TabBtn>
        </nav>
      </div>

      {preview && (
        <div className="no-print fixed inset-0 z-40 flex flex-col bg-black/50 sm:items-center sm:justify-center sm:p-6" onClick={() => setPreview(null)}>
          <div className="relative flex h-full w-full flex-col overflow-hidden bg-white sm:h-[min(860px,92dvh)] sm:w-[400px] sm:rounded-[32px] sm:border-[6px] sm:border-ink" onClick={(e) => e.stopPropagation()}>
            <div className="safe-t flex items-center justify-between bg-gold px-4 py-2 text-white">
              <span className="text-[13px] font-bold">患者さんの画面（確認用・記録されません）</span>
              <button type="button" onClick={() => setPreview(null)} className="rounded-full bg-white px-3 py-1 text-[13px] font-bold text-gold-700">閉じる</button>
            </div>
            <div className="flex-1 overflow-y-auto"><PatientApp token={preview.token} backend={patientBackend} preview /></div>
          </div>
        </div>
      )}

      {printing && <div className="print-only print-root"><PrintSheet patient={printing} lib={lib} /></div>}
      <Toast msg={toast} onDone={() => setToast(null)} />
    </>
  );
}

function NavBtn({ on, onClick, icon, children }: { on: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-[14px] font-bold ${on ? 'bg-brand-50 text-brand' : 'text-muted hover:bg-beige-50'}`}>{icon}{children}</button>;
}
function TabBtn({ on, onClick, icon, children }: { on: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} className={`flex flex-1 flex-col items-center gap-0.5 py-1 text-[11px] font-bold ${on ? 'text-brand' : 'text-sage'}`}>{icon}{children}</button>;
}
