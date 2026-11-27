// 人型アニメーション（見えている間だけ動かす）
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Anim } from '../figure/model';
import { cycleLength } from '../figure/model';
import { renderFrame, renderKey } from '../figure/render';

type Props = {
  anim: Anim;
  playing?: boolean;
  className?: string;
  fps?: number;
  speed?: number;
  onCycle?: (n: number) => void; // 1周するたびに呼ぶ（回数を数える）
  onCue?: (cue: string | undefined) => void;
  staticKey?: number; // 動かさずにこのポーズを表示
  focus?: boolean;
  startAt?: number;
  mirror?: boolean; // 左右反転（反対側をやるとき）
};

export function Figure({ anim: anim0, playing = true, className, fps = 30, speed = 1, onCycle, onCue, staticKey, focus = true, startAt = 0, mirror }: Props) {
  const anim = useMemo(() => (mirror ? { ...anim0, mirror: !anim0.mirror } : anim0), [anim0, mirror]);
  const ref = useRef<SVGSVGElement>(null);
  const [visible, setVisible] = useState(true);
  const t0 = useRef<number | null>(null);
  const elapsed = useRef(startAt);
  const lastCycle = useRef(0);
  const lastCue = useRef<string | undefined>('__');
  const cbs = useRef({ onCycle, onCue });
  cbs.current = { onCycle, onCue };

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver((es) => setVisible(es.some((e) => e.isIntersecting)), { rootMargin: '80px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // 静止画
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (staticKey !== undefined || !playing) {
      const r = staticKey !== undefined ? renderKey(anim, staticKey, { focus }) : renderFrame(anim, elapsed.current, { focus });
      el.setAttribute('viewBox', r.viewBox);
      el.innerHTML = r.body;
    }
  }, [anim, staticKey, playing, focus]);

  useEffect(() => {
    if (staticKey !== undefined || !playing || !visible) { t0.current = null; return; }
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    let last = 0;
    const len = cycleLength(anim);
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (now - last < 1000 / fps) return;
      const dt = last ? Math.min(0.2, (now - last) / 1000) : 0;
      last = now;
      elapsed.current += dt * speed;
      const r = renderFrame(anim, elapsed.current, { focus });
      el.setAttribute('viewBox', r.viewBox);
      el.innerHTML = r.body;
      const c = Math.floor(elapsed.current / len);
      if (c > lastCycle.current) { lastCycle.current = c; cbs.current.onCycle?.(c); }
      if (r.cue !== lastCue.current) { lastCue.current = r.cue; cbs.current.onCue?.(r.cue); }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [anim, playing, visible, staticKey, fps, speed, focus]);

  return <svg ref={ref} className={className} role="img" aria-label="運動の動き" preserveAspectRatio="xMidYMid meet" />;
}

/** 印刷・静止用の SVG 文字列 */
export function figureSvg(anim: Anim, keyIndex: number) {
  const r = renderKey(anim, keyIndex, { focus: true });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${r.viewBox}">${r.body}</svg>`;
}
