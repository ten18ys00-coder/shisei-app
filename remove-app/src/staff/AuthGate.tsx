import React, { useEffect, useState } from 'react';
import { Eye, EyeOff, Loader2, LockKeyhole } from 'lucide-react';
import { signInWithPasscode, supabase } from '../lib/backend';
import { APP_BY, APP_TAGLINE, APP_VERSION } from '../config';
import { Logo, Wordmark } from '../components/ui';

/** 院のパスコードでログイン（初回のみ。以降はこの端末に記憶） */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<'checking' | 'out' | 'in'>('checking');
  const [code, setCode] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    supabase().auth.getSession().then(({ data }) => { if (alive) setState(data.session ? 'in' : 'out'); }).catch(() => alive && setState('out'));
    const { data: sub } = supabase().auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') setState('out');
      else if (session && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) setState('in');
    });
    return () => { alive = false; sub.subscription.unsubscribe(); };
  }, []);

  if (state === 'in') return <>{children}</>;
  if (state === 'checking') return <div className="grid min-h-screen place-items-center text-muted"><Loader2 className="animate-spin" /></div>;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) { setErr('パスコードを入力してください。'); return; }
    setBusy(true); setErr(null);
    const r = await signInWithPasscode(code.trim());
    setBusy(false);
    if (r.ok) { setCode(''); setState('in'); } else setErr(r.message);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-beige-50 px-5" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <form onSubmit={submit} className="w-full max-w-sm rounded-3xl border border-line bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col items-center text-center">
          <Logo size={64} />
          <h1 className="mt-4 text-[34px] leading-none"><Wordmark /></h1>
          <p className="mt-1 text-[12px] font-semibold tracking-wider text-muted">{APP_BY}</p>
          <p className="mt-3 font-serif text-[15px] font-bold text-brand">{APP_TAGLINE}</p>
          <p className="text-[12px] text-muted">ほさか整骨院 運動処方（院内用）</p>
        </div>
        <label className="mt-7 block">
          <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-ink"><LockKeyhole size={15} />院のパスコード</span>
          <div className="relative">
            <input
              type={show ? 'text' : 'password'} autoComplete="current-password" autoCapitalize="none" autoCorrect="off" spellCheck={false}
              value={code} onChange={(e) => setCode(e.target.value)} aria-invalid={!!err}
              className="h-12 w-full rounded-xl border border-sage-200 bg-white px-4 pr-12 text-[17px] focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
            <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-1 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-lg text-muted" aria-label={show ? 'パスコードを隠す' : 'パスコードを表示'}>
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </label>
        {err && <p className="mt-2 text-sm text-rose-700" role="alert">{err}</p>}
        <button type="submit" disabled={busy} className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand text-[16px] font-bold text-white disabled:opacity-60">
          {busy && <Loader2 size={18} className="animate-spin" />}ログイン
        </button>
        <p className="mt-4 text-[13px] leading-relaxed text-muted">姿勢アプリ・栄養アプリと同じ、院のパスコードです。一度ログインすると、この端末に記憶されます。</p>
        <p className="mt-2 text-[12px] text-muted">患者さんは、先生から受け取ったリンク（QRコード）から開いてください。</p>
      </form>
      <p className="mt-4 text-[12px] text-muted">{APP_VERSION}</p>
    </div>
  );
}
