// 患者さんに渡す：QRコード・リンク・LINEに貼る文面・印刷用シート
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Copy, MessageCircle, Printer, Smartphone } from 'lucide-react';
import type { Lib } from '../lib/library';
import { hasAnim } from '../lib/library';
import type { Patient } from '../types';
import { doseText, todayJST } from '../lib/util';
import { Button, Wordmark } from '../components/ui';
import { figureSvg } from '../components/Figure';
import { APP_BY, IS_DEMO } from '../config';

export function patientUrl(token: string) {
  const base = location.origin + location.pathname;
  return `${base}?${IS_DEMO ? 'demo&' : ''}p=${token}`;
}

export function useQr(text: string) {
  const [svg, setSvg] = useState('');
  useEffect(() => {
    let alive = true;
    QRCode.toString(text, { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#1d2925', light: '#ffffff' } })
      .then((s) => alive && setSvg(s))
      .catch(() => alive && setSvg(''));
    return () => { alive = false; };
  }, [text]);
  return svg;
}

export function lineText(p: Patient, url: string) {
  return `${p.label}\nほさか整骨院です。ご自宅で行う運動メニュー（Re:MOVE）をお送りします。\n下のリンクを開くと、動きを見ながら一緒にできます（ホーム画面に追加すると便利です）。\n${url}\n\n※痛みが強くなる運動はお休みして、次回の来院時に教えてください。`;
}

export function Handoff({ patient, onToast, onPreview, onPrint }: { patient: Patient; onToast: (m: string) => void; onPreview: () => void; onPrint: () => void }) {
  const url = patientUrl(patient.token);
  const qr = useQr(url);
  const copy = async (t: string, msg: string) => {
    try { await navigator.clipboard.writeText(t); onToast(msg); } catch { window.prompt('コピーしてください', t); }
  };
  const empty = patient.plan.items.length === 0;
  return (
    <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
      <div className="mx-auto w-[200px]">
        <div className="rounded-2xl border border-line bg-white p-3">
          {qr ? <div className="aspect-square w-full [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: qr }} /> : <div className="aspect-square w-full animate-pulse rounded bg-beige" />}
        </div>
        <p className="mt-1.5 text-center text-[12px] text-muted">患者さんのスマホのカメラで読み取り</p>
      </div>
      <div className="space-y-2">
        {empty && <p className="rounded-xl bg-gold-100 px-3 py-2 text-[13px] text-gold-700">まだメニューが空です。先にメニューを作ってから渡しましょう。</p>}
        <div className="break-all rounded-xl bg-beige-50 px-3 py-2 font-mono text-[12px] text-muted">{url}</div>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="soft" onClick={() => copy(url, 'リンクをコピーしました')}><Copy size={16} />リンクをコピー</Button>
          <Button variant="soft" onClick={() => copy(lineText(patient, url), 'LINE用の文面をコピーしました')}><MessageCircle size={16} />LINE用の文面</Button>
          <Button variant="soft" onClick={onPreview}><Smartphone size={16} />患者さんの画面</Button>
          <Button variant="soft" onClick={onPrint}><Printer size={16} />紙で渡す（印刷）</Button>
        </div>
        <p className="text-[12px] leading-relaxed text-muted">リンクは、この方専用の鍵つきURLです。メニューを直すと、同じリンクのまま中身が新しくなります。リンクを知られたくない事情ができたら「設定」からリンクを作り直せます。</p>
      </div>
    </div>
  );
}

/** A4 の運動メニュー用紙 */
export function PrintSheet({ patient, lib, clinicName = 'ほさか整骨院', tel = '028-666-6141' }: { patient: Patient; lib: Lib; clinicName?: string; tel?: string }) {
  const url = patientUrl(patient.token);
  const qr = useQr(url);
  return (
    <div className="mx-auto max-w-[190mm] bg-white text-ink">
      <div className="flex items-start justify-between gap-4 border-b-2 border-brand pb-3">
        <div>
          <div className="text-[15px] leading-none"><Wordmark /> <span className="text-[10px] font-semibold tracking-wider text-muted">{APP_BY}</span></div>
          <div className="mt-1 font-serif text-[22px] font-bold text-brand">{patient.label}の運動メニュー</div>
          {patient.plan.title && <div className="text-[13px] text-muted">{patient.plan.title}</div>}
          <div className="mt-1 text-[11px] text-muted">{todayJST().replace(/-/g, '.')} ／ {clinicName}　TEL {tel}</div>
        </div>
        <div className="w-[30mm] shrink-0 text-center">
          {qr && <div className="[&>svg]:h-auto [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: qr }} />}
          <div className="text-[9px] leading-tight text-muted">スマホで読み取ると<br />動きが見られます</div>
        </div>
      </div>
      {patient.plan.message && <div className="mt-3 rounded-lg bg-beige-50 px-3 py-2 text-[12.5px]"><b className="text-brand">先生から：</b>{patient.plan.message}</div>}
      <div className="mt-3 grid grid-cols-2 gap-3">
        {patient.plan.items.map((it, i) => {
          const ex = lib.byId[it.exId];
          if (!ex) return null;
          return (
            <div key={it.id} className="sheet-item rounded-lg border border-line p-2.5">
              <div className="flex gap-2.5">
                {hasAnim(ex) && <div className="fig-bg w-[34mm] shrink-0 overflow-hidden rounded [&>svg]:block [&>svg]:h-auto [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: figureSvg(ex.anim, Math.min(1, ex.anim.keys.length - 1)) }} />}
                <div className="min-w-0">
                  <div className="text-[13px] font-bold leading-snug"><span className="num mr-1 text-gold-700">{i + 1}.</span>{ex.name}</div>
                  <div className="mt-0.5 text-[11.5px] font-bold text-brand">{doseText(it)}</div>
                  {it.note && <div className="text-[11px] text-gold-700">{it.note}</div>}
                  <div className="mt-1 text-[10px] text-muted">□□□□□□□　□□□□□□□</div>
                </div>
              </div>
              <ol className="mt-1.5 space-y-0.5 text-[10.5px] leading-snug">
                {ex.steps.map((s, j) => <li key={j}>{j + 1}. {s}</li>)}
              </ol>
            </div>
          );
        })}
      </div>
      <div className="mt-3 border-t border-line pt-2 text-[10.5px] text-muted">痛みやしびれが強くなる運動はお休みして、次回の来院時に先生へお伝えください。□はできた日にチェックしましょう。</div>
    </div>
  );
}
