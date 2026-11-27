// 運動ライブラリ（ほさか整骨院オリジナル。文章・動きはすべて院のために新しく作ったもの）
import type { Anim, Pose } from '../figure/model';

export type Area = 'neck' | 'shoulder' | 'arm' | 'back' | 'lowback' | 'hip' | 'knee' | 'ankle' | 'core' | 'posture' | 'whole';
export type Purpose = 'stretch' | 'strength' | 'mobility' | 'balance' | 'relax';
export type Position = 'stand' | 'sit' | 'floor';

export const AREA_LABEL: Record<Area, string> = {
  neck: '首', shoulder: '肩・肩甲骨', arm: '腕・手首', back: '背中', lowback: '腰', hip: '股関節・お尻',
  knee: 'ひざ・太もも', ankle: '足首・ふくらはぎ', core: '体幹', posture: '姿勢', whole: '全身',
};
export const AREA_ORDER: Area[] = ['posture', 'neck', 'shoulder', 'arm', 'back', 'lowback', 'core', 'hip', 'knee', 'ankle', 'whole'];
export const PURPOSE_LABEL: Record<Purpose, string> = {
  stretch: 'ストレッチ', strength: '筋トレ', mobility: '動きをよくする', balance: 'バランス', relax: 'リラックス・呼吸',
};
export const POSITION_LABEL: Record<Position, string> = { stand: '立って', sit: '座って', floor: '床で' };
export const LEVEL_LABEL = ['', 'やさしい', 'ふつう', 'しっかり'] as const;

export type Dose = { reps?: number; sets?: number; hold?: number; perDay?: number; sides?: boolean; seconds?: number };

export type Exercise = {
  id: string;
  name: string;
  areas: Area[];
  purpose: Purpose[];
  position: Position;
  level: 1 | 2 | 3;
  dose: Dose;
  target: string;
  steps: string[];
  points: string[];
  caution?: string;
  anim: Anim;
  custom?: boolean;
  video?: string;
};

// ---- よく使う姿勢 ----
const SIT: Partial<Pose> = { t: 0, h1: 88, k1: 86, a1: -2, h2: 88, k2: 86, a2: -2, s1: 14, e1: 62, s2: 14, e2: 62 };
const SIT_FRONT: Partial<Pose> = { h1: 5, h2: 5, tl1: 0.28, tl2: 0.28, k1: 0, k2: 0, s1: 8, e1: 30, s2: 8, e2: 30 };
const SUPINE: Partial<Pose> = { t: -90, h1: -3, h2: -3, a1: 0, a2: 0, s1: 6, e1: 4, s2: 6, e2: 4 };
const HOOK: Partial<Pose> = { ...SUPINE, h1: 48, k1: 100, a1: 38, h2: 48, k2: 100, a2: 38 };
const QUAD: Partial<Pose> = { t: 80, h1: 80, k1: 90, a1: 90, h2: 80, k2: 90, a2: 90, s1: 80, e1: 0, w1: 90, s2: 80, e2: 0, w2: 90, n: 0 };
const LONGSIT: Partial<Pose> = { t: -8, h1: 82, k1: 0, a1: 4, h2: 82, k2: 0, a2: 4, s1: -28, e1: 0, w1: -70, s2: -28, e2: 0, w2: -70 };
const PRONE_ELBOW: Partial<Pose> = { t: 90, c: -22, n: -6, h1: 0, k1: 0, a1: 88, h2: 0, k2: 0, a2: 88, s1: 68, e1: 90, s2: 68, e2: 90 };

export const EXERCISES: Exercise[] = [
  // ================= 姿勢 =================
  {
    id: 'wall-posture', name: '壁で姿勢リセット', areas: ['posture', 'back', 'neck'], purpose: ['mobility'], position: 'stand', level: 1,
    dose: { reps: 5, hold: 10, perDay: 3 },
    target: '背中・首の後ろ',
    steps: ['壁に背を向けて立ち、かかとを壁から5cmほど離します。', 'お尻・背中・後頭部を壁に近づけ、あごを軽く引きます。', '胸を軽く開いたまま、ゆっくり呼吸して10秒。力を抜いて戻ります。'],
    points: ['腰と壁のすき間は手のひら1枚分が目安', '肩の力は抜いたまま'],
    caution: '後頭部が壁につかない場合は、無理につけなくて大丈夫です。',
    anim: {
      view: 'side', anchor: 'ankle1', props: [{ type: 'wall', x: -20 }], focus: ['upperBack', 'neck'],
      keys: [
        { p: { t: 4, c: 18, n: 22, hd: -20, s1: 10, s2: 10 }, d: 1.2, hold: 0.6, cue: 'いつもの姿勢' },
        { p: { t: -2, c: -3, n: -2, hd: 6, s1: 0, s2: 0, e1: 4, e2: 4 }, d: 1.8, hold: 2.5, cue: '壁に近づけて10秒' },
      ],
    },
  },
  {
    id: 'chin-tuck', name: 'あご引き運動', areas: ['neck', 'posture'], purpose: ['mobility', 'strength'], position: 'sit', level: 1,
    dose: { reps: 10, hold: 3, perDay: 3 },
    target: '首の後ろ・首の奥の筋肉',
    steps: ['椅子に座って背すじを伸ばし、正面を見ます。', '目線は水平のまま、あごを後ろへスッと引きます（二重あごをつくるイメージ）。', '3秒止めて、ゆっくり戻します。'],
    points: ['うつむかない（目線は水平）', '首の後ろが伸びるのを感じる'],
    anim: {
      view: 'side', anchor: 'pelvis', ground: 'first', props: [{ type: 'chair' }], focus: ['neck'],
      base: SIT,
      keys: [
        { p: { n: 22, hd: -22, c: 6 }, d: 1, hold: 0.5, cue: '頭が前に出た姿勢' },
        { p: { n: -4, hd: 6, c: 0 }, d: 1.2, hold: 1.8, cue: 'あごを引いて3秒' },
      ],
    },
  },
  {
    id: 'pelvic-rock-sit', name: '座って骨盤を立てる', areas: ['posture', 'lowback'], purpose: ['mobility'], position: 'sit', level: 1,
    dose: { reps: 10, perDay: 3 },
    target: '腰・骨盤まわり',
    steps: ['椅子に浅めに座ります。', '骨盤を後ろへ倒して、背中を丸めます。', '次に骨盤を前へ起こし、おへそを前に出すように背すじを伸ばします。くり返します。'],
    points: ['動かすのは骨盤から', '最後は「骨盤が立った」まっすぐの姿勢で終わる'],
    anim: {
      view: 'side', anchor: 'pelvis', ground: 'first', props: [{ type: 'chair' }], focus: ['lowBack'],
      base: SIT,
      keys: [
        { p: { t: -14, c: 22, n: 16, hd: -10, h1: 74, h2: 74 }, d: 1.4, hold: 0.4, cue: '骨盤を倒して丸める' },
        { p: { t: 5, c: -4, n: -2, hd: 2, h1: 93, h2: 93 }, d: 1.4, hold: 0.8, cue: '骨盤を起こして伸ばす' },
      ],
    },
  },
  {
    id: 'towel-thoracic', name: 'タオルで胸を開く', areas: ['posture', 'back', 'shoulder'], purpose: ['stretch', 'relax'], position: 'floor', level: 1,
    dose: { reps: 5, hold: 10, perDay: 1 },
    target: '胸・背中の上部',
    steps: ['バスタオルを丸めて、肩甲骨の下あたりに横向きに置きます。', 'その上にあお向けになり、ひざを立てます。', '両腕をゆっくりバンザイして、胸を開いたまま10秒呼吸します。'],
    points: ['腰は反らさない', '腕は気持ちよく伸びる高さまで'],
    caution: '肩や腕にしびれが出る場合は、腕を下ろして先生に伝えてください。',
    anim: {
      view: 'side', anchor: 'ankle1', props: [{ type: 'mat' }, { type: 'towelRoll', at: 'upperBack' }], focus: ['chest'],
      base: { ...HOOK, c: -8 },
      keys: [
        { p: { s1: 8, s2: 8 }, d: 1.2, hold: 0.4 },
        { p: { s1: 160, e1: 8, s2: 160, e2: 8, c: -14, n: -8 }, d: 2.2, hold: 2.5, cue: 'バンザイして10秒' },
      ],
    },
  },
  {
    id: 'chest-open', name: '胸を開く（手を後ろで組む）', areas: ['posture', 'shoulder', 'back'], purpose: ['stretch'], position: 'stand', level: 1,
    dose: { hold: 15, sets: 2, perDay: 3 },
    target: '胸・肩の前',
    steps: ['足を腰幅に開いて立ち、両手を背中側で組みます。', '肩甲骨を寄せながら、組んだ手を斜め下へ引きます。', '胸を斜め上に向けるように開いて15秒。'],
    points: ['あごが上がりすぎないように', '腰を反らさず胸から開く'],
    anim: {
      view: 'side', anchor: 'ankle1', focus: ['chest'],
      keys: [
        { p: { s1: -18, e1: 20, s2: -18, e2: 20 }, d: 1, hold: 0.4 },
        { p: { s1: -48, e1: 6, s2: -48, e2: 6, c: -10, n: -6 }, d: 1.8, hold: 2.2, cue: '胸を開いて15秒' },
      ],
    },
  },

  // ================= 首 =================
  {
    id: 'neck-side-stretch', name: '首の横のストレッチ', areas: ['neck', 'shoulder'], purpose: ['stretch', 'relax'], position: 'sit', level: 1,
    dose: { hold: 20, sets: 2, perDay: 3, sides: true },
    target: '首の横〜肩の上',
    steps: ['椅子に座り、片手で座面の端を軽く持ちます。', '反対の手を頭の上から回し、頭をゆっくり横へ倒します。', '首の横が気持ちよく伸びたところで20秒。反対側も。'],
    points: ['手で強く引っぱらない（手の重みだけ）', '座面を持った側の肩を下げる'],
    caution: '腕や手にしびれが出る場合は中止してください。',
    anim: {
      view: 'front', anchor: 'pelvis', ground: 'first', props: [{ type: 'chair' }], focus: ['trap1', 'neckSide'],
      base: { ...SIT_FRONT, s1: 10, e1: 4 },
      keys: [
        { p: { s2: 20, e2: 30 }, d: 1, hold: 0.4 },
        { p: { s2: 136, e2: -104, n: 30, hd: 4, sh: -2 }, d: 2, hold: 2.5, cue: 'ゆっくり倒して20秒' },
      ],
    },
  },
  {
    id: 'neck-back-stretch', name: '首の後ろのストレッチ', areas: ['neck', 'back'], purpose: ['stretch'], position: 'sit', level: 1,
    dose: { hold: 20, sets: 2, perDay: 3 },
    target: '首の後ろ〜背中の上',
    steps: ['椅子に座り、両手を頭の後ろで組みます。', '手の重みで、頭をゆっくり前に倒します。', '首の後ろが伸びたところで20秒。ゆっくり戻します。'],
    points: ['ひじは閉じて力を抜く', '背中も一緒に軽く丸めてよい'],
    anim: {
      view: 'side', anchor: 'pelvis', ground: 'first', props: [{ type: 'chair' }], focus: ['neck'],
      base: { ...SIT, s1: 150, e1: 150, s2: 150, e2: 150 },
      keys: [
        { p: {}, d: 1.2, hold: 0.4 },
        { p: { n: 38, c: 10, hd: 6, s1: 128, s2: 128 }, d: 2, hold: 2.5, cue: '前に倒して20秒' },
      ],
    },
  },
  {
    id: 'shoulder-shrug', name: '肩のすくめ・ストン', areas: ['neck', 'shoulder'], purpose: ['relax', 'mobility'], position: 'sit', level: 1,
    dose: { reps: 10, perDay: 3 },
    target: '肩の上（首から肩）',
    steps: ['椅子に座って、腕の力を抜きます。', '息を吸いながら、両肩を耳に近づけるようにぎゅっと持ち上げます。', '2秒止めたら、息を吐きながら一気にストンと落とします。'],
    points: ['落とすときは力を完全に抜く', 'くり返すほど肩が軽くなる'],
    anim: {
      view: 'front', anchor: 'pelvis', ground: 'first', props: [{ type: 'chair' }], focus: ['trap1', 'trap2'],
      base: { ...SIT_FRONT, s1: 6, e1: 6, s2: 6, e2: 6 },
      keys: [
        { p: { sh: 0 }, d: 0.5, hold: 0.6, cue: 'ストン' },
        { p: { sh: 8 }, d: 1.2, hold: 1.2, cue: '吸って持ち上げる' },
      ],
    },
  },

  // ================= 肩・肩甲骨 =================
  {
    id: 'scapula-squeeze', name: '肩甲骨寄せ', areas: ['shoulder', 'posture', 'back'], purpose: ['strength', 'mobility'], position: 'sit', level: 1,
    dose: { reps: 10, hold: 3, sets: 2, perDay: 2 },
    target: '肩甲骨の間',
    steps: ['椅子に座り、ひじを90度に曲げて体の横に構えます。', '胸を張りながら、ひじを後ろへ引いて肩甲骨を寄せます。', '3秒止めて、ゆっくり戻します。'],
    points: ['肩をすくめない', '肩甲骨で鉛筆をはさむイメージ'],
    anim: {
      view: 'side', anchor: 'pelvis', ground: 'first', props: [{ type: 'chair' }], focus: ['shoulderBlade'],
      base: SIT,
      keys: [
        { p: { s1: 30, e1: 96, s2: 30, e2: 96, c: 6 }, d: 1, hold: 0.3 },
        { p: { s1: -38, e1: 96, s2: -38, e2: 96, c: -8, n: -4 }, d: 1.3, hold: 1.8, cue: '寄せて3秒' },
      ],
    },
  },
  {
    id: 'shoulder-roll', name: '肩回し（ひじで大きな円）', areas: ['shoulder', 'neck'], purpose: ['mobility', 'relax'], position: 'sit', level: 1,
    dose: { reps: 10, perDay: 3 },
    target: '肩甲骨まわり',
    steps: ['椅子に座り、指先を肩にのせます。', 'ひじで大きな円をかくように、前から上、後ろへとゆっくり回します。', '10回まわしたら、反対回しも行います。'],
    points: ['ひじをできるだけ大きく動かす', '後ろに回すときに胸を開く'],
    anim: {
      view: 'side', anchor: 'pelvis', ground: 'first', props: [{ type: 'chair' }], focus: ['shoulderBlade'],
      base: { ...SIT, e1: 150, e2: 150, w1: 0, w2: 0 },
      circular: ['s1', 's2'],
      keys: [
        { p: { s1: -10, s2: -10 }, d: 0.9 },
        { p: { s1: 70, s2: 70, c: 4 }, d: 0.9 },
        { p: { s1: 150, s2: 150, sh: 3 }, d: 0.9 },
        { p: { s1: 230, s2: 230, c: -8, sh: 2 }, d: 0.9 },
        { p: { s1: 300, s2: 300, c: -4 }, d: 0.9 },
      ],
    },
  },
  {
    id: 'wall-slide', name: 'ウォールスライド（壁で腕上げ）', areas: ['shoulder', 'posture'], purpose: ['mobility', 'strength'], position: 'stand', level: 1,
    dose: { reps: 10, sets: 2, perDay: 2 },
    target: '肩甲骨まわり',
    steps: ['壁に向かって立ち、ひじを曲げて前腕を壁につけます。', '前腕を壁にそわせたまま、ゆっくり腕を上へすべらせます。', '肩がすくまない高さまで上げたら、ゆっくり戻します。'],
    points: ['肩をすくめない', '下ろすときに肩甲骨が下がるのを感じる'],
    anim: {
      view: 'side', anchor: 'ankle1', props: [{ type: 'wall', x: 33 }], focus: ['shoulderBlade'],
      keys: [
        { p: { s1: 64, e1: 100, s2: 64, e2: 100, w1: -10, w2: -10 }, d: 1.2, hold: 0.3 },
        { p: { s1: 122, e1: 64, s2: 122, e2: 64, w1: -6, w2: -6 }, d: 2, hold: 0.6, cue: '壁にそって上げる' },
      ],
    },
  },
  {
    id: 'pendulum', name: '振り子運動', areas: ['shoulder'], purpose: ['mobility', 'relax'], position: 'stand', level: 1,
    dose: { seconds: 60, perDay: 3, sides: true },
    target: '肩の関節',
    steps: ['机や椅子の背に片手をついて、上体を前に倒します。', '反対の腕は力を抜いて、だらんと下げます。', '体を小さく揺らして、腕を前後に振り子のように揺らします（1分）。'],
    points: ['腕の力で振らない（体の揺れで動かす）', '痛くない小さな範囲でOK'],
    caution: '動かして痛みが強くなる場合は中止し、先生に伝えてください。',
    anim: {
      view: 'side', anchor: 'ankle2', props: [{ type: 'table', x: 34, w: 34, h: 70 }], focus: ['shoulder1'],
      base: { t: 58, h1: 50, k1: 14, h2: 70, k2: 12, a2: -8, s2: 68, e2: 14 },
      keys: [
        { p: { s1: 44, e1: 2 }, d: 1.1 },
        { p: { s1: 74, e1: 2 }, d: 1.1 },
      ],
    },
  },
  {
    id: 'arm-raise-front', name: '腕の前上げ（バンザイ運動）', areas: ['shoulder'], purpose: ['mobility'], position: 'stand', level: 1,
    dose: { reps: 10, perDay: 2 },
    target: '肩・脇の下',
    steps: ['足を腰幅に開いて立ち、親指を上に向けて腕を下ろします。', '腕をまっすぐ前から、ゆっくり上げていきます。', '痛みのない高さまで上げたら、ゆっくり下ろします。'],
    points: ['肩がすくまない高さまで', '腰を反らせて上げない'],
    caution: '痛みの出ない範囲で行ってください。',
    anim: {
      view: 'side', anchor: 'ankle1', focus: ['shoulder1'],
      keys: [
        { p: { s1: 2, e1: 4, s2: 2, e2: 4 }, d: 1.2, hold: 0.4 },
        { p: { s1: 168, e1: 4, s2: 168, e2: 4 }, d: 2.4, hold: 0.6, cue: 'ゆっくり上げる' },
      ],
    },
  },

  // ================= 腕・手首 =================
  {
    id: 'forearm-stretch', name: '前腕のストレッチ', areas: ['arm', 'shoulder'], purpose: ['stretch'], position: 'stand', level: 1,
    dose: { hold: 15, sets: 2, perDay: 3, sides: true },
    target: '前腕（ひじから手首）',
    steps: ['片腕を前にまっすぐ伸ばし、手首を下に曲げます。', '反対の手で指先を体の方へ、やさしく引きます。', '手のひらを前に向けた形・手の甲を前に向けた形を、それぞれ15秒。'],
    points: ['ひじは伸ばしたまま', 'パソコン・スマホ・家事のあとに'],
    anim: {
      view: 'side', anchor: 'ankle1', focus: ['forearm1'],
      keys: [
        { p: { s1: 86, e1: 0, w1: 0, s2: 10, e2: 20 }, d: 1.2, hold: 0.3 },
        { p: { s1: 88, e1: 0, w1: -78, s2: 62, e2: 46 }, d: 1.6, hold: 2.2, cue: 'やさしく引いて15秒' },
      ],
    },
  },

  // ================= 背中 =================
  {
    id: 'cat-cow', name: '背骨の丸め・反らし（四つ這い）', areas: ['back', 'lowback', 'posture'], purpose: ['mobility'], position: 'floor', level: 1,
    dose: { reps: 8, perDay: 2 },
    target: '背中・腰',
    steps: ['四つ這いになり、手は肩の下、ひざは股関節の下に置きます。', '息を吐きながら、おへそをのぞき込むように背中を丸めます。', '息を吸いながら、胸を前に出して背中をゆっくり反らせます。'],
    points: ['背骨をひとつずつ動かすイメージで', '反らすときは腰ではなく胸から'],
    anim: {
      view: 'side', anchor: 'knee1', props: [{ type: 'mat' }], focus: ['wholeBack'],
      base: QUAD,
      keys: [
        { p: { t: 68, c: 30, n: 30, s1: 98, s2: 98, h1: 68, h2: 68 }, d: 1.8, hold: 0.6, cue: '吐いて丸める' },
        { p: { t: 90, c: -22, n: -26, s1: 68, s2: 68, h1: 90, h2: 90 }, d: 1.8, hold: 0.6, cue: '吸って反らす' },
      ],
    },
  },
  {
    id: 'child-pose', name: '正座で背中のばし', areas: ['back', 'lowback', 'hip'], purpose: ['stretch', 'relax'], position: 'floor', level: 1,
    dose: { hold: 30, sets: 2, perDay: 2 },
    target: '背中・腰・お尻',
    steps: ['四つ這いになります。', '手の位置はそのままで、お尻をかかとの方へゆっくり引きます。', 'おでこを床に近づけ、背中が伸びたところで30秒ゆっくり呼吸します。'],
    points: ['腕は前に遠く伸ばす', '息を吐くたびに力を抜く'],
    caution: 'ひざが痛い場合は、お尻とかかとの間にクッションをはさんでください。',
    anim: {
      view: 'side', anchor: 'wrist1', props: [{ type: 'mat' }], focus: ['wholeBack'],
      base: QUAD,
      keys: [
        { p: {}, d: 1.2, hold: 0.4, cue: '四つ這い' },
        { p: { t: 112, c: 4, n: 24, h1: 160, k1: 138, h2: 160, k2: 138, s1: 196, e1: 0, w1: 6, s2: 196, e2: 0, w2: 6 }, d: 2.2, hold: 2.5, cue: 'お尻を引いて30秒' },
      ],
    },
  },
  {
    id: 'seated-reach', name: '座って背伸び', areas: ['back', 'whole', 'posture'], purpose: ['stretch', 'relax'], position: 'sit', level: 1,
    dose: { reps: 5, hold: 5, perDay: 3 },
    target: '背中・脇の下',
    steps: ['椅子に座り、両手を組みます。', '息を吸いながら、手のひらを天井に向けて腕を上へ伸ばします。', '背すじが伸びたところで5秒。息を吐きながら下ろします。'],
    points: ['お尻は座面から浮かさない', '上に引っぱられるように'],
    anim: {
      view: 'side', anchor: 'pelvis', ground: 'first', props: [{ type: 'chair' }], focus: ['side', 'upperBack'],
      base: SIT,
      keys: [
        { p: { s1: 60, e1: 100, s2: 60, e2: 100 }, d: 1, hold: 0.3 },
        { p: { s1: 176, e1: 4, s2: 176, e2: 4, c: -6, n: -8 }, d: 1.8, hold: 2, cue: '吸って伸びる' },
      ],
    },
  },
  {
    id: 'side-bend', name: '体側のばし', areas: ['back', 'whole'], purpose: ['stretch'], position: 'stand', level: 1,
    dose: { hold: 15, sets: 2, perDay: 2, sides: true },
    target: 'わき腹・背中の横',
    steps: ['足を肩幅に開いて立ちます。', '片腕を頭の上へ伸ばし、反対の手は腰に当てます。', '上げた腕の方向へ、体をゆっくり横に倒して15秒。'],
    points: ['体が前に倒れないように', '呼吸は止めずに'],
    anim: {
      view: 'front', anchor: 'pelvis', focus: ['side'],
      base: { h1: 6, h2: 6, s1: 40, e1: 118, s2: 6, e2: 6 },
      keys: [
        { p: { s2: 172, e2: 8 }, d: 1.2, hold: 0.4 },
        { p: { t: -6, c: -20, h1: 12, h2: 0, s2: 174, e2: 14, n: -8 }, d: 1.8, hold: 2.2, cue: 'ゆっくり倒す' },
      ],
    },
  },

  // ================= 腰 =================
  {
    id: 'knees-to-chest', name: '両ひざかかえ', areas: ['lowback', 'hip'], purpose: ['stretch', 'relax'], position: 'floor', level: 1,
    dose: { hold: 20, sets: 2, perDay: 2 },
    target: '腰・お尻',
    steps: ['あお向けになり、両ひざを立てます。', '両ひざを胸の方へ引き寄せ、両手でかかえます。', '腰が伸びたところで20秒、ゆっくり呼吸します。'],
    points: ['頭と肩の力は抜く', '息を吐くたびに少しずつ近づける'],
    anim: {
      view: 'side', anchor: 'pelvis', props: [{ type: 'mat' }], focus: ['lowBack'],
      base: HOOK,
      keys: [
        { p: {}, d: 1.2, hold: 0.4 },
        { p: { h1: 146, k1: 122, a1: 10, h2: 146, k2: 122, a2: 10, s1: 58, e1: -22, s2: 58, e2: -22, t: -84 }, d: 1.8, hold: 2.5, cue: 'かかえて20秒' },
      ],
    },
  },
  {
    id: 'single-knee-to-chest', name: '片ひざかかえ', areas: ['lowback', 'hip'], purpose: ['stretch'], position: 'floor', level: 1,
    dose: { hold: 20, sets: 2, perDay: 2, sides: true },
    target: '腰・お尻',
    steps: ['あお向けになり、両脚を伸ばします（つらい場合は反対のひざを立てる）。', '片ひざを胸の方へ引き寄せ、両手でかかえます。', '20秒たったら脚をかえます。'],
    points: ['伸ばしている脚の太ももが浮かないように', '腰が床にふれる感じで'],
    anim: {
      view: 'side', anchor: 'pelvis', props: [{ type: 'mat' }], focus: ['glute', 'lowBack'],
      base: SUPINE,
      keys: [
        { p: {}, d: 1.2, hold: 0.4 },
        { p: { h1: 140, k1: 122, a1: 10, s1: 52, e1: -22, s2: 52, e2: -22 }, d: 1.8, hold: 2.5, cue: 'かかえて20秒' },
      ],
    },
  },
  {
    id: 'pelvic-tilt', name: 'あお向けで骨盤ゆらし', areas: ['lowback', 'core'], purpose: ['mobility', 'relax'], position: 'floor', level: 1,
    dose: { reps: 10, perDay: 2 },
    target: '腰・下腹',
    steps: ['あお向けになり、ひざを立てます。', '息を吐きながら、腰を床に押しつけるように骨盤を後ろへ倒します。', '息を吸いながら、腰と床の間に少しすき間ができるように戻します。'],
    points: ['お尻は床から浮かせない', '小さな動きでOK'],
    anim: {
      view: 'side', anchor: 'ankle1', props: [{ type: 'mat' }], focus: ['lowBack', 'abdomen'],
      base: HOOK,
      keys: [
        { p: { t: -86, c: -6, h1: 52, h2: 52, belly: 0 }, d: 1.5, hold: 0.4, cue: '吸って腰にすき間' },
        { p: { t: -95, c: 4, h1: 43, h2: 43, belly: 0 }, d: 1.5, hold: 0.8, cue: '吐いて腰を床へ' },
      ],
    },
  },
  {
    id: 'draw-in', name: 'お腹へこませ呼吸（ドローイン）', areas: ['core', 'lowback'], purpose: ['strength', 'relax'], position: 'floor', level: 1,
    dose: { reps: 10, hold: 5, perDay: 2 },
    target: 'お腹の奥（腰を支える筋肉）',
    steps: ['あお向けになり、ひざを立てます。', '鼻から息を吸って、お腹をふくらませます。', '口から細く長く吐きながら、おへそを床に近づけるようにへこませ、5秒キープします。'],
    points: ['腰は反らさず、床にそっと押しつける', '慣れたら座っても立ってもできる'],
    anim: {
      view: 'side', anchor: 'ankle1', props: [{ type: 'mat' }], focus: ['abdomen'],
      base: HOOK,
      keys: [
        { p: { belly: 1 }, d: 2, hold: 0.4, cue: '吸ってふくらませる' },
        { p: { belly: 0, t: -92 }, d: 2.5, hold: 2, cue: '吐いてへこませ5秒' },
      ],
    },
  },
  {
    id: 'sphinx', name: 'うつ伏せで上体起こし', areas: ['lowback', 'back', 'posture'], purpose: ['mobility'], position: 'floor', level: 2,
    dose: { reps: 10, hold: 3, perDay: 2 },
    target: '腰・お腹の前',
    steps: ['うつ伏せになり、ひじを肩の真下について上体を起こします。', '腰・お尻の力は抜いたまま、胸を前に送るように少し高く起こします。', '3秒止めて、ゆっくり戻します。'],
    points: ['おへそは床から離さない', '肩をすくめない'],
    caution: '腰や脚の痛み・しびれが強くなる場合はすぐに中止して、先生に伝えてください。',
    anim: {
      view: 'side', anchor: 'pelvis', props: [{ type: 'mat' }], focus: ['lowBack'],
      base: PRONE_ELBOW,
      keys: [
        { p: { c: -12, s1: 78, s2: 78, n: 0 }, d: 1.3, hold: 0.4 },
        { p: { c: -34, s1: 56, s2: 56, n: -10 }, d: 1.5, hold: 1.8, cue: '胸を起こして3秒' },
      ],
    },
  },
  {
    id: 'hamstring-chair', name: '太もも裏のストレッチ（椅子）', areas: ['knee', 'lowback', 'hip'], purpose: ['stretch'], position: 'sit', level: 1,
    dose: { hold: 20, sets: 2, perDay: 2, sides: true },
    target: '太ももの裏',
    steps: ['椅子に浅く座り、片脚を前に伸ばしてかかとを床につけます。', '背すじを伸ばしたまま、股関節から体を前に倒します。', '太ももの裏が伸びたところで20秒。反対側も。'],
    points: ['背中を丸めない（おへそを太ももに近づける）', 'つま先は天井へ'],
    anim: {
      view: 'side', anchor: 'pelvis', ground: 'first', props: [{ type: 'chair' }], focus: ['hamstring1'],
      base: { ...SIT, h1: 52, k1: 2, a1: -14, s1: 30, e1: 20 },
      keys: [
        { p: {}, d: 1.2, hold: 0.4 },
        { p: { t: 30, h1: 82, h2: 118, s1: 58, e1: 10, s2: 50, e2: 30, n: 4 }, d: 2, hold: 2.5, cue: '前に倒して20秒' },
      ],
    },
  },

  // ================= 体幹 =================
  {
    id: 'bird-dog', name: '四つ這いで手脚のばし', areas: ['core', 'lowback', 'hip'], purpose: ['strength', 'balance'], position: 'floor', level: 2,
    dose: { reps: 10, hold: 3, perDay: 1, sides: true },
    target: '背中・お尻・体幹',
    steps: ['四つ這いになり、背中をまっすぐにします。', '右手と左脚を、床と平行になるまでゆっくり伸ばします。', '3秒止めて戻し、反対の手脚も同じように行います。'],
    points: ['腰が反らないよう、お腹に軽く力を入れる', '手は遠くへ、かかとは後ろへ'],
    anim: {
      view: 'side', anchor: 'knee1', props: [{ type: 'mat' }], focus: ['glute2', 'lowBack'],
      base: QUAD,
      keys: [
        { p: {}, d: 1, hold: 0.3 },
        { p: { s1: 172, e1: 0, w1: 0, h2: -6, k2: 0, a2: 30, n: -4 }, d: 1.5, hold: 1.8, cue: '手脚を伸ばして3秒' },
        { p: {}, d: 1.2, hold: 0.3 },
        { p: { s2: 172, e2: 0, w2: 0, h1: -6, k1: 0, a1: 30, n: -4 }, d: 1.5, hold: 1.8, cue: '反対も3秒' },
      ],
    },
  },
  {
    id: 'dead-bug', name: 'デッドバグ（あお向けで手脚のばし）', areas: ['core'], purpose: ['strength'], position: 'floor', level: 3,
    dose: { reps: 8, perDay: 1, sides: true },
    target: 'お腹（体幹）',
    steps: ['あお向けで両腕を天井へ、股関節とひざを90度に曲げて脚を浮かせます。', '腰を床に押しつけたまま、片腕と反対の脚をゆっくり遠くへ伸ばします。', '元に戻して、反対側も同じように行います。'],
    points: ['腰が床から浮かないところまで', '息は止めずに吐きながら伸ばす'],
    caution: '腰が反ってしまう場合は、伸ばす範囲を小さくしてください。',
    anim: {
      view: 'side', anchor: 'pelvis', props: [{ type: 'mat' }], focus: ['abdomen'],
      base: { ...SUPINE, s1: 90, e1: 0, s2: 90, e2: 0, h1: 90, k1: 90, a1: 10, h2: 90, k2: 90, a2: 10 },
      keys: [
        { p: {}, d: 1, hold: 0.3 },
        { p: { s1: 168, h2: 22, k2: 4 }, d: 1.6, hold: 0.8, cue: '吐きながら伸ばす' },
        { p: {}, d: 1.2, hold: 0.3 },
        { p: { s2: 168, h1: 22, k1: 4 }, d: 1.6, hold: 0.8, cue: '反対も' },
      ],
    },
  },
  {
    id: 'knee-plank', name: 'ひざつきプランク', areas: ['core'], purpose: ['strength'], position: 'floor', level: 2,
    dose: { hold: 20, sets: 3, perDay: 1 },
    target: 'お腹・体幹',
    steps: ['うつ伏せから、ひじを肩の真下について上体を起こします。', 'ひざを床についたまま、お尻を持ち上げて頭からひざまで一直線にします。', 'その姿勢で20秒キープします。'],
    points: ['お尻が上がりすぎ・下がりすぎに注意', '呼吸は止めない'],
    anim: {
      view: 'side', anchor: 'elbow1', props: [{ type: 'mat' }], focus: ['abdomen'],
      base: { t: 72, h1: 0, k1: 18, a1: 90, h2: 0, k2: 18, a2: 90, s1: 72, e1: 90, s2: 72, e2: 90 },
      keys: [
        { p: { t: 56, h1: -34, k1: 0, h2: -34, k2: 0, s1: 56, s2: 56 }, d: 1.2, hold: 0.6, cue: 'ひじをつく' },
        { p: { n: -4 }, d: 1.6, hold: 3, cue: '一直線で20秒' },
      ],
    },
  },
  {
    id: 'plank', name: 'プランク', areas: ['core'], purpose: ['strength'], position: 'floor', level: 3,
    dose: { hold: 30, sets: 3, perDay: 1 },
    target: 'お腹・体幹全体',
    steps: ['ひじを肩の真下につき、つま先を立てます。', 'お腹に力を入れて体を持ち上げ、頭からかかとまで一直線にします。', '30秒キープします。'],
    points: ['腰が落ちない・お尻が上がらない', 'きつい日はひざつきでOK'],
    caution: '腰に痛みが出る場合は中止して、ひざつきプランクに戻してください。',
    anim: {
      view: 'side', anchor: 'elbow1', props: [{ type: 'mat' }], focus: ['abdomen'],
      base: { t: 79, h1: 0, k1: 0, a1: 22, f1: -60, h2: 0, k2: 0, a2: 22, f2: -60, s1: 79, e1: 90, s2: 79, e2: 90 },
      keys: [
        { p: { t: 72, h1: 0, k1: 18, a1: 90, f1: 0, h2: 0, k2: 18, a2: 90, f2: 0, s1: 72, s2: 72 }, d: 1.2, hold: 0.6, cue: 'ひざをついて準備' },
        { p: { n: -4 }, d: 1.6, hold: 3, cue: 'ひざを浮かせて30秒' },
      ],
    },
  },
  {
    id: 'side-plank', name: 'サイドプランク（ひじつき）', areas: ['core', 'hip'], purpose: ['strength'], position: 'floor', level: 3,
    dose: { hold: 20, sets: 2, perDay: 1, sides: true },
    target: 'わき腹・お尻の横',
    steps: ['横向きに寝て、下側のひじを肩の真下につきます。', 'お腹に力を入れて、腰を床から持ち上げます。', '頭から足まで一直線にして20秒。反対側も。'],
    points: ['お尻が後ろに引けないように', 'きつい場合はひざを曲げて行う'],
    anim: {
      view: 'front', anchor: 'ankle1', props: [{ type: 'mat' }], focus: ['side', 'hipSide'],
      base: { t: -76, s1: 76, e1: -92, s2: 14, e2: 20, h1: -14, h2: 14 },
      keys: [
        { p: {}, d: 1.2, hold: 0.6, cue: 'ひじをつく' },
        { p: { t: -70, h1: 0, h2: 0, s1: 70, e1: -92, n: 4 }, d: 1.6, hold: 3, cue: '腰を上げて20秒' },
      ],
    },
  },

  // ================= 股関節・お尻 =================
  {
    id: 'bridge', name: 'お尻上げ（ヒップリフト）', areas: ['hip', 'lowback', 'core'], purpose: ['strength'], position: 'floor', level: 2,
    dose: { reps: 10, sets: 2, hold: 3, perDay: 1 },
    target: 'お尻・太ももの裏',
    steps: ['あお向けになり、ひざを立てて足を腰幅に開きます。', '息を吐きながら、お尻をゆっくり持ち上げます。', '肩からひざが一直線になったら3秒止めて、ゆっくり下ろします。'],
    points: ['腰を反らせすぎない', 'お尻をきゅっと締める'],
    anim: {
      view: 'side', anchor: 'ankle1', props: [{ type: 'mat' }], focus: ['glute', 'hamstring1'],
      base: HOOK,
      keys: [
        { p: {}, d: 1.2, hold: 0.4, cue: '吸って' },
        { p: { t: -116, h1: 0, k1: 118, a1: 30, h2: 0, k2: 118, a2: 30, s1: -24, s2: -24 }, d: 1.6, hold: 1.5, cue: '吐きながら上げて3秒' },
      ],
    },
  },
  {
    id: 'half-kneel-hip-flexor', name: '股関節の前のストレッチ（片ひざ立ち）', areas: ['hip', 'lowback', 'posture'], purpose: ['stretch'], position: 'floor', level: 2,
    dose: { hold: 20, sets: 2, perDay: 2, sides: true },
    target: '股関節の前（腸腰筋）',
    steps: ['片ひざを床につき、反対の足を前に出してひざを90度にします。', 'お腹に軽く力を入れたまま、体ごとゆっくり前へ移動します。', '後ろ脚の付け根の前が伸びたところで20秒。反対側も。'],
    points: ['腰を反らせない（お尻を締める）', '上半身はまっすぐ'],
    caution: '床についたひざが痛い場合は、タオルやクッションを敷いてください。',
    anim: {
      view: 'side', anchor: 'knee2', props: [{ type: 'mat' }], focus: ['hipFront2'],
      base: { t: 0, h1: 88, k1: 92, a1: 0, h2: -2, k2: 92, a2: 90, s1: 36, e1: 14, s2: 36, e2: 14 },
      keys: [
        { p: {}, d: 1, hold: 0.4 },
        { p: { t: 2, h1: 102, k1: 72, a1: -18, h2: -26, k2: 64, a2: 90, s1: 40, s2: 40 }, d: 1.8, hold: 2.2, cue: '前へ移動して20秒' },
      ],
    },
  },
  {
    id: 'side-lying-abduction', name: '横向き脚上げ（お尻の横）', areas: ['hip', 'knee'], purpose: ['strength'], position: 'floor', level: 2,
    dose: { reps: 10, sets: 2, perDay: 1, sides: true },
    target: 'お尻の横（中殿筋）',
    steps: ['横向きに寝て、下の腕を枕にします。', '上の脚をまっすぐ伸ばしたまま、かかとから斜め後ろへ持ち上げます。', '1秒止めて、ゆっくり下ろします。'],
    points: ['つま先は正面か少し下向き', '体が後ろに倒れないように'],
    anim: {
      view: 'front', anchor: 'pelvis', props: [{ type: 'mat' }], focus: ['hipSide'],
      base: { t: -90, s1: 176, e1: 90, s2: 6, e2: 8, h1: 2, h2: 2, n: -4 },
      keys: [
        { p: {}, d: 1, hold: 0.3 },
        { p: { h2: 38 }, d: 1.4, hold: 0.8, cue: '上げて1秒' },
      ],
    },
  },
  {
    id: 'donkey-kick', name: '四つ這いで脚上げ（お尻）', areas: ['hip', 'core'], purpose: ['strength'], position: 'floor', level: 2,
    dose: { reps: 10, sets: 2, perDay: 1, sides: true },
    target: 'お尻（大殿筋）',
    steps: ['四つ這いになります。', 'ひざを90度に曲げたまま、足の裏を天井に向けて片脚を持ち上げます。', '太ももが床と平行になったら1秒止めて、ゆっくり戻します。'],
    points: ['腰を反らさない', '持ち上げる高さより、お尻の力を感じること'],
    anim: {
      view: 'side', anchor: 'wrist1', props: [{ type: 'mat' }], focus: ['glute'],
      base: QUAD,
      keys: [
        { p: {}, d: 1, hold: 0.3 },
        { p: { h1: -8, k1: 92, a1: 0 }, d: 1.4, hold: 0.8, cue: '上げて1秒' },
      ],
    },
  },
  {
    id: 'figure4-sit', name: 'お尻のストレッチ（椅子で足を組む）', areas: ['hip', 'lowback'], purpose: ['stretch'], position: 'sit', level: 1,
    dose: { hold: 20, sets: 2, perDay: 2, sides: true },
    target: 'お尻の奥',
    steps: ['椅子に座り、片方の足首を反対の膝の上にのせます。', '背すじを伸ばしたまま、上体をゆっくり前へ倒します。', 'お尻の奥が伸びたところで20秒。反対側も。'],
    points: ['背中を丸めない', 'のせた脚のひざを軽く下へ'],
    caution: 'ひざや股関節が痛む場合は、足首を低い位置（すね）にのせてください。',
    anim: {
      view: 'side', anchor: 'pelvis', ground: 'first', props: [{ type: 'chair' }], focus: ['glute'],
      base: { ...SIT, h1: 104, k1: 86, sl1: 0.45, a1: 30, s1: 26, e1: 50 },
      keys: [
        { p: {}, d: 1.2, hold: 0.4 },
        { p: { t: 26, h1: 128, h2: 114, s1: 50, e1: 40, s2: 40, e2: 50 }, d: 2, hold: 2.5, cue: '前へ倒して20秒' },
      ],
    },
  },
  {
    id: 'butterfly', name: '内もものストレッチ（足裏合わせ）', areas: ['hip'], purpose: ['stretch'], position: 'floor', level: 1,
    dose: { hold: 20, sets: 2, perDay: 2 },
    target: '内もも・股関節',
    steps: ['床に座り、両足の裏を合わせてかかとを体に引き寄せます。', '両手で足先を持ち、背すじを伸ばします。', 'ひざを床の方へゆっくり下ろし、内ももが伸びたところで20秒。'],
    points: ['ひざを手で押さない', '背中が丸まる場合はかかとを少し遠くに'],
    anim: {
      view: 'front', anchor: 'pelvis', props: [{ type: 'mat' }], focus: ['innerThigh'],
      base: { h1: 64, h2: 64, tl1: 0.82, tl2: 0.82, k1: 134, k2: 134, s1: 18, e1: 24, s2: 18, e2: 24 },
      keys: [
        { p: {}, d: 1.2, hold: 0.4 },
        { p: { h1: 80, h2: 80, k1: 152, k2: 152, s1: 14, s2: 14 }, d: 1.8, hold: 2.4, cue: 'ひざを下ろして20秒' },
      ],
    },
  },
  {
    id: 'inner-thigh-ball', name: '内ももでボールつぶし', areas: ['hip', 'knee'], purpose: ['strength'], position: 'floor', level: 1,
    dose: { reps: 10, hold: 5, perDay: 2 },
    target: '内もも',
    steps: ['あお向けでひざを立て、ひざの間にクッションやボールをはさみます。', 'ひざでクッションをぎゅっとつぶし、5秒キープします。', 'ゆっくり力を抜きます。'],
    points: ['お尻は浮かせない', '椅子に座ってもできます'],
    anim: {
      view: 'side', anchor: 'ankle1', props: [{ type: 'mat' }, { type: 'ball', at: 'knees', r: 9 }], focus: ['innerThigh'],
      base: HOOK,
      keys: [
        { p: { pr: 0 }, d: 0.8, hold: 0.6, cue: 'ゆるめる' },
        { p: { pr: 1 }, d: 0.8, hold: 2, cue: 'ぎゅっと5秒' },
      ],
    },
  },

  // ================= ひざ・太もも =================
  {
    id: 'quad-set', name: '太もも前の力入れ（タオルつぶし）', areas: ['knee'], purpose: ['strength'], position: 'floor', level: 1,
    dose: { reps: 10, hold: 5, sets: 2, perDay: 3, sides: true },
    target: '太ももの前（ひざのお皿の上）',
    steps: ['床に脚を伸ばして座り、ひざの下に丸めたタオルを置きます。', 'つま先を手前に向けながら、ひざの裏でタオルを押しつぶします。', '太ももの前に力が入ったまま5秒。ゆっくり力を抜きます。'],
    points: ['ひざのお皿が上に引き上がるのを感じる', '寝たままでもできます'],
    anim: {
      view: 'side', anchor: 'pelvis', props: [{ type: 'mat' }, { type: 'towelRoll', at: 'knee1' }], focus: ['quad1'],
      base: { ...LONGSIT, k1: 10, h1: 86, a1: 6 },
      keys: [
        { p: { pr: 0 }, d: 0.9, hold: 0.6, cue: 'ゆるめる' },
        { p: { k1: 0, h1: 82, a1: -16, pr: 1 }, d: 1, hold: 2.2, cue: '押しつぶして5秒' },
      ],
    },
  },
  {
    id: 'slr', name: '脚上げ（あお向け）', areas: ['knee', 'hip'], purpose: ['strength'], position: 'floor', level: 2,
    dose: { reps: 10, sets: 2, perDay: 1, sides: true },
    target: '太ももの前・股関節の前',
    steps: ['あお向けで、片方のひざを立てます。', '反対の脚はひざを伸ばしたまま、つま先を手前に向けます。', 'その脚を、立てたひざの高さまでゆっくり上げて、ゆっくり下ろします。'],
    points: ['ひざが曲がらないように', '下ろすときもゆっくり'],
    anim: {
      view: 'side', anchor: 'pelvis', props: [{ type: 'mat' }], focus: ['quad1'],
      base: { ...SUPINE, h2: 48, k2: 100, a2: 38, a1: -12 },
      keys: [
        { p: { h1: -3 }, d: 1, hold: 0.4 },
        { p: { h1: 42, a1: -14 }, d: 1.8, hold: 0.6, cue: 'ゆっくり上げる' },
      ],
    },
  },
  {
    id: 'seated-knee-ext', name: '座ってひざ伸ばし', areas: ['knee'], purpose: ['strength'], position: 'sit', level: 1,
    dose: { reps: 10, sets: 2, hold: 3, perDay: 2, sides: true },
    target: '太ももの前',
    steps: ['椅子に深く座り、背すじを伸ばします。', '片方のひざをゆっくり伸ばし、つま先を天井に向けて3秒止めます。', 'ゆっくり下ろします。反対側も同じように。'],
    points: ['太ももの前に力が入るのを感じながら', '反動をつけない'],
    anim: {
      view: 'side', anchor: 'pelvis', ground: 'first', props: [{ type: 'chair' }], focus: ['quad1'],
      base: SIT,
      keys: [
        { p: {}, d: 1, hold: 0.4 },
        { p: { k1: 2, a1: -18, h1: 84 }, d: 1.5, hold: 1.5, cue: '伸ばして3秒' },
      ],
    },
  },
  {
    id: 'sit-to-stand', name: '椅子から立ち上がり', areas: ['knee', 'hip', 'whole'], purpose: ['strength', 'balance'], position: 'sit', level: 1,
    dose: { reps: 10, sets: 2, perDay: 2 },
    target: '太もも・お尻',
    steps: ['椅子に浅めに座り、足を少し手前に引きます。', 'おじぎをするように上体を前に倒し、お尻が浮いたらそのまま立ち上がります。', 'ゆっくりお尻を下ろして座ります。'],
    points: ['手で太ももを押さずに立てると◎', '座るときこそゆっくり'],
    anim: {
      view: 'side', anchor: 'ankle1', props: [{ type: 'chair' }], focus: ['quad1', 'glute'],
      base: { s1: 40, e1: 20, s2: 40, e2: 20 },
      keys: [
        { p: { t: 0, h1: 92, k1: 98, a1: -8, h2: 92, k2: 98, a2: -8 }, d: 1.3, hold: 0.4, cue: '座る' },
        { p: { t: 42, h1: 132, k1: 98, a1: -8, h2: 132, k2: 98, a2: -8, s1: 70, s2: 70 }, d: 1.2, hold: 0.2, cue: 'おじぎ' },
        { p: { t: 0, h1: 0, k1: 0, a1: 0, h2: 0, k2: 0, a2: 0, s1: 40, s2: 40 }, d: 1.4, hold: 0.6, cue: '立つ' },
        { p: { t: 40, h1: 118, k1: 88, a1: -14, h2: 118, k2: 88, a2: -14, s1: 70, s2: 70 }, d: 1.6, hold: 0, cue: 'ゆっくり座る' },
      ],
    },
  },
  {
    id: 'chair-squat', name: '椅子スクワット', areas: ['knee', 'hip'], purpose: ['strength'], position: 'stand', level: 2,
    dose: { reps: 10, sets: 2, perDay: 1 },
    target: '太ももの前・お尻',
    steps: ['椅子の前に、足を腰幅に開いて立ちます。', '両腕を前に伸ばし、お尻を後ろへ引くようにゆっくり腰を下ろします。', 'お尻が座面に軽くふれたら、かかとで床を押して立ち上がります。'],
    points: ['ひざとつま先は同じ向きに', '背中を丸めず、胸を少し前へ'],
    caution: 'ひざに痛みが出る場合は、浅い位置までにして先生に伝えてください。',
    anim: {
      view: 'side', anchor: 'ankle1', props: [{ type: 'chair', key: 1 }], focus: ['quad1', 'glute'],
      base: { s1: 85, e1: 0, s2: 85, e2: 0 },
      keys: [
        { p: { t: 0, h1: 0, k1: 0, h2: 0, k2: 0, s1: 80, s2: 80 }, d: 1.2, hold: 0.4, cue: '立つ' },
        { p: { t: 42, h1: 100, k1: 82, a1: -22, h2: 100, k2: 82, a2: -22 }, d: 2, hold: 0.3, cue: 'ゆっくり下ろす' },
      ],
    },
  },
  {
    id: 'lunge', name: 'フロントランジ', areas: ['knee', 'hip', 'core'], purpose: ['strength', 'balance'], position: 'stand', level: 3,
    dose: { reps: 8, sets: 2, perDay: 1, sides: true },
    target: '太もも・お尻',
    steps: ['足を腰幅に開いて立ちます。', '片脚を大きく前に踏み出し、後ろのひざを床に近づけるように腰を下ろします。', '前の足で床を押して、元の位置に戻ります。'],
    points: ['前のひざがつま先より前に出すぎない', '上半身はまっすぐ'],
    caution: 'ひざに痛みが出る場合は中止してください。',
    anim: {
      view: 'side', anchor: 'ball2', focus: ['quad1', 'glute'],
      base: { s1: 10, e1: 30, s2: 10, e2: 30 },
      keys: [
        { p: { h1: 0, k1: 0, h2: 0, k2: 0 }, d: 1, hold: 0.4, cue: '立つ' },
        { p: { h1: 84, k1: 84, a1: -2, h2: -24, k2: 56, a2: -28, f2: -48 }, d: 1.8, hold: 0.6, cue: '踏み出して下ろす' },
      ],
    },
  },
  {
    id: 'standing-quad-stretch', name: '太もも前のストレッチ（立って）', areas: ['knee', 'hip', 'lowback'], purpose: ['stretch'], position: 'stand', level: 1,
    dose: { hold: 20, sets: 2, perDay: 2, sides: true },
    target: '太ももの前（大腿直筋）',
    steps: ['壁や椅子の背に片手をついて立ちます。', '片方のひざを曲げ、同じ側の手で足首を持ちます。', 'かかとをお尻に近づけ、ひざを少し後ろへ引いて20秒。反対側も。'],
    points: ['腰を反らさない（お腹に軽く力を入れる）', 'ひざが外に開かないように'],
    caution: 'ひざに痛みがある場合や足首まで手が届かない場合は、タオルを足首にかけて行ってください。',
    anim: {
      view: 'side', anchor: 'ankle2', props: [{ type: 'wall', x: 46 }], focus: ['quad1'],
      base: { s2: 70, e2: 26 },
      keys: [
        { p: {}, d: 1, hold: 0.4 },
        { p: { h1: -8, k1: 148, a1: 30, s1: -22, e1: 2 }, d: 1.8, hold: 2.4, cue: '足首を持って20秒' },
      ],
    },
  },
  {
    id: 'soft-knee-stand', name: 'ひざをゆるめて立つ練習', areas: ['knee', 'posture'], purpose: ['mobility', 'balance'], position: 'stand', level: 1,
    dose: { seconds: 30, sets: 3, perDay: 3 },
    target: 'ひざ・お尻・お腹',
    steps: ['鏡の横に立ち、いつもの立ち方でひざが伸びきっていないか見ます。', 'ひざのお皿が少し前に出るくらいに、ひざの力をふっとゆるめます。', 'お尻とお腹に軽く力を入れ、かかとと親指のつけ根に体重をのせて30秒。'],
    points: ['ひざを「曲げる」のではなく「ゆるめる」', '信号待ちや歯みがきのときにも'],
    anim: {
      view: 'side', anchor: 'ankle1', focus: ['knee1', 'glute'],
      keys: [
        { p: { k1: -7, k2: -7, h1: -5, h2: -5, a1: 4, a2: 4, t: -3 }, d: 1, hold: 0.8, cue: 'ひざが伸びきった立ち方' },
        { p: { k1: 7, k2: 7, h1: 4, h2: 4, a1: -3, a2: -3, t: 1 }, d: 1.4, hold: 2.2, cue: 'ひざをゆるめて30秒' },
      ],
    },
  },
  {
    id: 'single-leg-stand', name: '片脚立ち', areas: ['ankle', 'knee', 'hip'], purpose: ['balance'], position: 'stand', level: 1,
    dose: { seconds: 30, sets: 2, perDay: 3, sides: true },
    target: '足首・お尻・体幹',
    steps: ['壁や椅子の背の近くに立ち、すぐ支えられるようにします。', '片脚をゆっくり持ち上げ、もう片方の脚で立ちます。', 'ふらつかずに30秒を目標に。反対側も。'],
    points: ['目線は前方の一点に', '慣れたら支えなしで'],
    caution: '転倒に注意して、必ず支えられるものの近くで行ってください。',
    anim: {
      view: 'side', anchor: 'ankle2', props: [{ type: 'wall', x: 44 }], focus: ['ankle1', 'glute2'],
      base: { s1: 18, e1: 20, s2: 64, e2: 30 },
      keys: [
        { p: {}, d: 1, hold: 0.5 },
        { p: { h1: 58, k1: 72, a1: 12 }, d: 1.4, hold: 2.8, cue: '片脚で30秒' },
      ],
    },
  },

  // ================= 足首・ふくらはぎ =================
  {
    id: 'ankle-pump', name: '足首の曲げ伸ばし', areas: ['ankle'], purpose: ['mobility'], position: 'floor', level: 1,
    dose: { reps: 20, perDay: 3 },
    target: 'ふくらはぎ・すね',
    steps: ['床に脚を伸ばして座ります（あお向けでもOK）。', 'つま先をゆっくり手前に引きよせます。', '次につま先を遠くへ伸ばします。リズムよくくり返します。'],
    points: ['足首を大きく動かす', 'むくみが気になるときにも'],
    anim: {
      view: 'side', anchor: 'pelvis', props: [{ type: 'mat' }], focus: ['calf1'],
      base: LONGSIT,
      keys: [
        { p: { a1: -22, a2: -22 }, d: 0.9, hold: 0.3, cue: '手前に引く' },
        { p: { a1: 40, a2: 40 }, d: 0.9, hold: 0.3, cue: '遠くへ伸ばす' },
      ],
    },
  },
  {
    id: 'towel-gather', name: 'タオルギャザー（足指でたぐる）', areas: ['ankle'], purpose: ['strength'], position: 'sit', level: 1,
    dose: { reps: 20, sets: 2, perDay: 1, sides: true },
    target: '足の裏・足指',
    steps: ['椅子に座り、床に広げたタオルの上に足をのせます。', 'かかとは床につけたまま、足の指でタオルをつかんで手前にたぐり寄せます。', 'タオルの端まで続けます。'],
    points: ['指をしっかり開いてからつかむ', '土踏まずを意識して'],
    anim: {
      view: 'side', anchor: 'pelvis', ground: 'first', props: [{ type: 'chair' }, { type: 'towelFlat', at: 'ball1' }], focus: ['sole1'],
      base: SIT,
      keys: [
        { p: { f1: -24 }, d: 0.6, hold: 0.2, cue: '指を開く' },
        { p: { f1: 40 }, d: 0.6, hold: 0.3, cue: 'つかむ' },
      ],
    },
  },
  {
    id: 'toe-raise', name: 'つま先上げ', areas: ['ankle', 'knee'], purpose: ['strength', 'balance'], position: 'stand', level: 1,
    dose: { reps: 15, sets: 2, perDay: 2 },
    target: 'すねの前',
    steps: ['壁や椅子の背に手をそえて立ちます。', 'かかとを床につけたまま、つま先をゆっくり持ち上げます。', '1秒止めて、ゆっくり下ろします。'],
    points: ['お尻が後ろに引けないように', 'つまずき予防に'],
    anim: {
      view: 'side', anchor: 'heel1', props: [{ type: 'wall', x: 44 }], focus: ['shinFront1'],
      base: { s1: 60, e1: 34, s2: 60, e2: 34 },
      keys: [
        { p: {}, d: 0.9, hold: 0.3 },
        { p: { a1: -24, a2: -24, f1: 6, f2: 6, t: -2 }, d: 1, hold: 0.8, cue: '上げて1秒' },
      ],
    },
  },
  {
    id: 'calf-raise', name: 'かかと上げ', areas: ['ankle'], purpose: ['strength', 'balance'], position: 'stand', level: 1,
    dose: { reps: 15, sets: 2, perDay: 2 },
    target: 'ふくらはぎ',
    steps: ['壁や椅子の背に軽く手をそえて立ちます。', 'かかとをゆっくり持ち上げ、つま先立ちで1秒止めます。', 'かかとをゆっくり下ろします。'],
    points: ['親指のつけ根に体重をのせる', '下ろすときこそゆっくり'],
    anim: {
      view: 'side', anchor: 'ball1', props: [{ type: 'wall', x: 46 }], focus: ['calf1'],
      base: { s1: 62, e1: 30, s2: 62, e2: 30 },
      keys: [
        { p: {}, d: 1, hold: 0.3 },
        { p: { a1: 32, f1: -32, a2: 32, f2: -32 }, d: 1.2, hold: 0.8, cue: '上げて1秒' },
      ],
    },
  },
  {
    id: 'calf-stretch-wall', name: 'ふくらはぎのストレッチ（壁押し）', areas: ['ankle', 'knee'], purpose: ['stretch'], position: 'stand', level: 1,
    dose: { hold: 20, sets: 2, perDay: 2, sides: true },
    target: 'ふくらはぎ',
    steps: ['壁に両手をつき、片脚を後ろに大きく引きます。', '後ろ脚のひざを伸ばし、かかとを床につけたままにします。', '前のひざを曲げて体重を前へ。ふくらはぎが伸びたところで20秒。'],
    points: ['後ろのつま先はまっすぐ前へ', 'かかとが浮かないように'],
    anim: {
      view: 'side', anchor: 'heel2', props: [{ type: 'wall', x: 98 }], focus: ['calf2'],
      base: { t: 18, h1: 38, k1: 30, a1: -10, h2: 0, k2: 0, a2: -18, s1: 112, e1: 24, s2: 112, e2: 24, w1: -70, w2: -70 },
      keys: [
        { p: { t: 11, h1: 30, k1: 20, a1: -8, a2: -11, s1: 100, e1: 52, s2: 100, e2: 52 }, d: 1.2, hold: 0.4 },
        { p: {}, d: 1.8, hold: 2.4, cue: '体重を前に20秒' },
      ],
    },
  },

  // ================= 全身・リラックス =================
  {
    id: 'belly-breath', name: '腹式呼吸', areas: ['whole', 'core'], purpose: ['relax'], position: 'floor', level: 1,
    dose: { reps: 10, perDay: 2 },
    target: '呼吸の筋肉（横隔膜）・自律神経',
    steps: ['あお向けになり、ひざを立てて片手をお腹にのせます。', '鼻から4秒かけて息を吸い、お腹をふくらませます。', '口から6〜8秒かけてゆっくり吐き、お腹をしぼませます。'],
    points: ['吐く息を長く', '寝る前やリラックスしたいときに'],
    anim: {
      view: 'side', anchor: 'ankle1', props: [{ type: 'mat' }], focus: ['abdomen'],
      base: { ...HOOK, s1: -4, e1: 56 },
      keys: [
        { p: { belly: 1 }, d: 3, hold: 0.5, cue: '吸って4秒' },
        { p: { belly: 0 }, d: 4, hold: 0.8, cue: '吐いて6〜8秒' },
      ],
    },
  },
  {
    id: 'full-stretch', name: '全身の伸び', areas: ['whole', 'posture'], purpose: ['stretch', 'relax'], position: 'stand', level: 1,
    dose: { reps: 3, hold: 5, perDay: 3 },
    target: '全身',
    steps: ['足を腰幅に開いて立ち、両手を組みます。', '息を吸いながら、腕を頭の上へまっすぐ伸ばし、かかとを少し上げます。', '5秒伸びたら、息を吐きながら力を抜いて下ろします。'],
    points: ['上から引っぱられるように', 'ふらつく場合はかかとは上げなくてOK'],
    anim: {
      view: 'side', anchor: 'ball1', focus: ['side'],
      keys: [
        { p: { s1: 4, s2: 4 }, d: 1, hold: 0.4 },
        { p: { s1: 178, e1: 2, s2: 178, e2: 2, a1: 18, f1: -18, a2: 18, f2: -18, c: -6, n: -8 }, d: 2, hold: 1.8, cue: '吸って伸びる' },
      ],
    },
  },
  {
    id: 'wall-pushup', name: '壁腕立て', areas: ['shoulder', 'arm', 'core'], purpose: ['strength'], position: 'stand', level: 1,
    dose: { reps: 10, sets: 2, perDay: 1 },
    target: '胸・腕・体幹',
    steps: ['壁から一歩離れて立ち、肩の高さで両手を壁につけます。', '体をまっすぐに保ったまま、ひじを曲げて胸を壁に近づけます。', '壁を押して元に戻ります。'],
    points: ['お尻が引けないように一直線', '肩をすくめない'],
    anim: {
      view: 'side', anchor: 'ball1', props: [{ type: 'wall', x: 100 }], focus: ['chest'],
      base: { h1: 0, h2: 0, w1: -70, w2: -70 },
      keys: [
        { p: { t: 16, a1: -16, a2: -16, s1: 104, e1: 4, s2: 104, e2: 4 }, d: 1.2, hold: 0.3, cue: '押す' },
        { p: { t: 30, a1: -30, a2: -30, s1: 64, e1: 100, s2: 64, e2: 100 }, d: 1.6, hold: 0.5, cue: 'ひじを曲げて近づける' },
      ],
    },
  },
  {
    id: 'marching-sit', name: '座って足踏み', areas: ['hip', 'knee', 'whole'], purpose: ['strength', 'balance'], position: 'sit', level: 1,
    dose: { seconds: 60, perDay: 2 },
    target: '股関節の前・太もも',
    steps: ['椅子に座り、背すじを伸ばします。', '片方のももを持ち上げ、ゆっくり下ろします。', '左右交互に、1分間足踏みします。'],
    points: ['背もたれに寄りかからない', '腕も軽く振るとさらに◎'],
    anim: {
      view: 'side', anchor: 'pelvis', ground: 'first', props: [{ type: 'chair' }], focus: ['hipFront1'],
      base: { ...SIT, s1: 30, e1: 80, s2: 30, e2: 80 },
      keys: [
        { p: { h1: 116, k1: 96, s1: -10, s2: 50 }, d: 0.7, hold: 0.15 },
        { p: {}, d: 0.6 },
        { p: { h2: 116, k2: 96, s2: -10, s1: 50 }, d: 0.7, hold: 0.15 },
        { p: {}, d: 0.6 },
      ],
    },
  },
  {
    id: 'marching-stand', name: 'その場足踏み', areas: ['whole', 'hip', 'knee'], purpose: ['strength', 'balance'], position: 'stand', level: 1,
    dose: { seconds: 60, perDay: 2 },
    target: '全身・股関節',
    steps: ['まっすぐ立ちます。', 'ももを高く上げながら、腕を大きく振って足踏みします。', '1分間続けます。'],
    points: ['背すじを伸ばしたまま', 'ふらつく場合は壁の近くで'],
    anim: {
      view: 'side', anchor: 'pelvis', focus: ['hipFront1'],
      base: { e1: 80, e2: 80 },
      keys: [
        { p: { h1: 70, k1: 80, a1: 10, s1: -30, s2: 50 }, d: 0.55, hold: 0.1 },
        { p: { s1: 10, s2: 10 }, d: 0.45 },
        { p: { h2: 70, k2: 80, a2: 10, s2: -30, s1: 50 }, d: 0.55, hold: 0.1 },
        { p: { s1: 10, s2: 10 }, d: 0.45 },
      ],
    },
  },
];

export const EX_BY_ID: Record<string, Exercise> = Object.fromEntries(EXERCISES.map((e) => [e.id, e]));
