import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { classNames } from '../lib/util';

export const LOGO_INNER = `
  <path d="M31.2 11.6 A13.2 13.2 0 1 0 33.2 20.6" fill="none" stroke="#d2ae62" stroke-width="2.4" stroke-linecap="round"/>
  <path d="M28.6 8.6 L32.4 11.9 L27.9 13.4" fill="none" stroke="#d2ae62" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="22.2" cy="11.4" r="2.9" fill="#ffffff"/>
  <path d="M20.6 16 L18.4 23.6 L13.6 28.6 M18.4 23.6 L23.6 28.4 M20.6 16.6 L25.8 20.4 M20.6 16.6 L14.4 18.6" stroke="#ffffff" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;

export function Logo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden>
      <rect width="40" height="40" rx="10" fill="#214d3d" />
      <g dangerouslySetInnerHTML={{ __html: LOGO_INNER }} />
    </svg>
  );
}

/** Re:MOVE の文字ロゴ（Re: が金） */
export function Wordmark({ className, light }: { className?: string; light?: boolean }) {
  return (
    <span className={classNames('font-display font-bold tracking-[-0.01em]', className)}>
      <span className={light ? 'text-[#e2c27e]' : 'text-gold'}>Re:</span><span className={light ? 'text-white' : 'text-brand'}>MOVE</span>
    </span>
  );
}

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'soft' | 'danger' | 'gold'; size?: 'sm' | 'md' | 'lg' };
export function Button({ variant = 'primary', size = 'md', className, ...rest }: BtnProps) {
  const v = {
    primary: 'bg-brand text-white hover:bg-brand-700 disabled:opacity-50',
    ghost: 'bg-transparent text-brand hover:bg-brand-50',
    soft: 'bg-brand-50 text-brand hover:bg-brand-100 border border-brand-100',
    danger: 'bg-white text-rose-700 border border-rose-200 hover:bg-rose-50',
    gold: 'bg-gold text-white hover:bg-gold-700',
  }[variant];
  const s = { sm: 'h-9 px-3 text-[13px] rounded-lg', md: 'h-11 px-4 text-[15px] rounded-xl', lg: 'h-14 px-6 text-[17px] rounded-2xl' }[size];
  return <button type="button" {...rest} className={classNames('inline-flex items-center justify-center gap-1.5 font-bold transition-colors disabled:cursor-not-allowed', v, s, className)} />;
}

export function Chip({ on, children, onClick, className }: { on?: boolean; children: React.ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button type="button" onClick={onClick} className={classNames('shrink-0 rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors', on ? 'border-brand bg-brand text-white' : 'border-line bg-white text-ink hover:border-sage', className)}>
      {children}
    </button>
  );
}

export function Modal({ open, onClose, title, children, wide, footer }: { open: boolean; onClose: () => void; title?: React.ReactNode; children: React.ReactNode; wide?: boolean; footer?: React.ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', k);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', k); document.body.style.overflow = prev; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className={classNames('flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-xl sm:rounded-3xl', wide ? 'sm:max-w-4xl' : 'sm:max-w-lg')}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
          <div className="min-w-0 text-[17px] font-bold text-ink">{title}</div>
          <button type="button" onClick={onClose} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted hover:bg-beige" aria-label="閉じる"><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="border-t border-line px-5 py-3" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>{footer}</div>}
      </div>
    </div>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[13px] font-bold text-ink">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[12px] text-muted">{hint}</span>}
    </label>
  );
}

export const inputCls = 'w-full rounded-xl border border-sage-200 bg-white px-3.5 py-2.5 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-100';

export function Toast({ msg, onDone }: { msg: string | null; onDone: () => void }) {
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(onDone, 2600);
    return () => clearTimeout(t);
  }, [msg, onDone]);
  if (!msg) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex justify-center px-4" style={{ bottom: 'max(24px, env(safe-area-inset-bottom))' }}>
      <div className="rounded-full bg-ink/90 px-5 py-2.5 text-[14px] font-medium text-white shadow-lg">{msg}</div>
    </div>
  );
}

export function Empty({ icon, title, children }: { icon?: React.ReactNode; title: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-sage-200 bg-beige-50 px-6 py-10 text-center">
      {icon && <div className="mb-3 text-sage">{icon}</div>}
      <div className="font-bold text-ink">{title}</div>
      {children && <div className="mt-1 text-[14px] text-muted">{children}</div>}
    </div>
  );
}
