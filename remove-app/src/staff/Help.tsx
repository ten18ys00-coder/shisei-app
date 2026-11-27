// 使い方（院内向け）
export function Help({ demo }: { demo: boolean }) {
  const steps = [
    ['患者さんを追加', '「患者さん」→「追加」。呼び名（例：山田さん）と院内メモを入れます。フルネームは不要です。'],
    ['メニューを作る', '「運動を選ぶ」で部位・目的から探すか、「セットから追加」で型を入れてから調整。回数・秒数・セット・1日の回数、一言メモを変えられます。'],
    ['渡す', '「渡す」のQRコードを患者さんのスマホで読み取ってもらいます。LINE用の文面をコピーして送ることも、A4で印刷して渡すこともできます。'],
    ['患者さんがやる', '患者さんはリンクを開くだけ（ログイン不要）。人型の動きを見ながら「一緒にスタート」で回数・秒数を数えてくれます。できたらチェック、痛み（0〜10）とひとことを送ります。'],
    ['続いているか見る', '一覧の7マスで、この1週間の実施がわかります。3日以上記録がない方・痛みの数字が上がっている方は「声かけ候補」に出ます。来院時の会話や、次のメニュー調整に使ってください。'],
    ['卒業', '自分でできるようになったら「設定」→「卒業・休止」。リンクは止まり、記録は残ります。'],
  ];
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-serif text-[22px] font-bold text-brand">使い方</h2>
        <p className="mt-1 text-[14px] text-muted">「痛みが消えた＝治った」ではなく、再発しない身体づくりを、院の外でも続けてもらうための道具です。</p>
      </div>
      <ol className="space-y-3">
        {steps.map(([t, d], i) => (
          <li key={t} className="flex gap-3 rounded-2xl border border-line p-4">
            <span className="num grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand font-bold text-white">{i + 1}</span>
            <div><div className="font-bold">{t}</div><div className="text-[14px] text-muted">{d}</div></div>
          </li>
        ))}
      </ol>
      <div className="rounded-2xl bg-beige-50 p-4 text-[14px] leading-relaxed">
        <div className="mb-1 font-bold text-gold-700">先生の動画を使うには</div>
        「運動ライブラリ」で運動を開き、下の欄にYouTubeの限定公開URLを貼ります。その運動には人型アニメーションに加えて先生の動画が出ます。新しい運動は「院オリジナルを追加」から作れます（近い動きの人型アニメーションを借りることもできます）。
      </div>
      <div className="rounded-2xl border border-line p-4 text-[13px] leading-relaxed text-muted">
        <div className="mb-1 font-bold text-ink">データについて</div>
        {demo
          ? 'お試し版のデータはこの端末の中だけに保存されます（架空の患者さんです）。右上の↻で最初の状態に戻せます。'
          : 'データは姿勢アプリ・栄養アプリと同じ院専用の保存先（東京リージョン）に入り、院のパスコードでログインした端末だけが見られます。患者さんはリンクの鍵で、自分のメニューと記録だけを扱えます。'}
      </div>
    </div>
  );
}
