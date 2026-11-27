// 運動の説明（先生側・患者さん側で共通）
import { AlertTriangle, PlayCircle, Target } from 'lucide-react';
import { AREA_LABEL, LEVEL_LABEL, POSITION_LABEL, PURPOSE_LABEL, type Exercise } from '../data/exercises';
import { Figure } from './Figure';
import { hasAnim } from '../lib/library';
import { youtubeId } from '../lib/util';

/** 回数の表示（1日○回などが途中で折り返さないように） */
export function DoseText({ text, className }: { text: string; className?: string }) {
  const parts = text.replace(' × ', '\u00a0×\u00a0').split(/(?=（左右）)|　/);
  return <span className={className}>{parts.map((p, i) => <span key={i} className="whitespace-nowrap">{p}{i < parts.length - 1 ? ' ' : ''}</span>)}</span>;
}

export function Tags({ ex }: { ex: Exercise }) {
  return (
    <div className="flex flex-wrap gap-1.5 text-[12px]">
      {ex.areas.slice(0, 3).map((a) => <span key={a} className="rounded-full bg-brand-50 px-2 py-0.5 text-brand">{AREA_LABEL[a]}</span>)}
      {ex.purpose.slice(0, 2).map((p) => <span key={p} className="rounded-full bg-beige px-2 py-0.5 text-muted">{PURPOSE_LABEL[p]}</span>)}
      <span className="rounded-full bg-white px-2 py-0.5 text-muted ring-1 ring-line">{POSITION_LABEL[ex.position]}・{LEVEL_LABEL[ex.level]}</span>
      {ex.custom && <span className="rounded-full bg-gold-100 px-2 py-0.5 text-gold-700">院オリジナル</span>}
    </div>
  );
}

export function VideoEmbed({ url, title }: { url: string; title: string }) {
  const yt = youtubeId(url);
  if (yt) {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black">
        <iframe
          className="h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${yt}?rel=0&playsinline=1`}
          title={title}
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }
  if (/\.(mp4|webm|mov)(\?|$)/i.test(url)) {
    return <video className="w-full rounded-2xl bg-black" src={url} controls playsInline preload="metadata" />;
  }
  return (
    <a href={url} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-xl border border-line px-4 py-3 text-brand">
      <PlayCircle size={20} />先生の動画を開く
    </a>
  );
}

export function ExerciseBody({ ex, showFigure = true, doseLine }: { ex: Exercise; showFigure?: boolean; doseLine?: string }) {
  return (
    <div className="space-y-4">
      {showFigure && hasAnim(ex) && (
        <div className="fig-bg overflow-hidden rounded-2xl">
          <Figure anim={ex.anim} className="mx-auto block aspect-[4/3] w-full max-w-md" />
        </div>
      )}
      {ex.video && <VideoEmbed url={ex.video} title={ex.name} />}
      <Tags ex={ex} />
      {doseLine && <div className="rounded-xl bg-brand-50 px-4 py-2.5 font-bold text-brand">{doseLine}</div>}
      {ex.target && (
        <div className="flex items-start gap-2 text-[14px]">
          <Target size={18} className="mt-0.5 shrink-0 text-gold" />
          <div><span className="font-bold">効くところ：</span>{ex.target}<span className="ml-1 text-[12px] text-muted">（絵の金色の部分）</span></div>
        </div>
      )}
      {ex.steps.length > 0 && (
        <ol className="space-y-2">
          {ex.steps.map((s, i) => (
            <li key={i} className="flex gap-3">
              <span className="num grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand text-[13px] font-bold text-white">{i + 1}</span>
              <span className="text-[15px] leading-relaxed">{s}</span>
            </li>
          ))}
        </ol>
      )}
      {ex.points.length > 0 && (
        <div className="rounded-xl bg-beige-50 px-4 py-3">
          <div className="mb-1 text-[13px] font-bold text-gold-700">コツ</div>
          <ul className="space-y-1 text-[14px]">{ex.points.map((p, i) => <li key={i}>・{p}</li>)}</ul>
        </div>
      )}
      {ex.caution && (
        <div className="flex gap-2 rounded-xl border border-rose-200 bg-rose-50/60 px-4 py-3 text-[14px] text-rose-900">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <span>{ex.caution}</span>
        </div>
      )}
    </div>
  );
}
