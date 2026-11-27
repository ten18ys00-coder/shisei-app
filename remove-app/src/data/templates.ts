// よく使うメニューのセット（先生がワンタップで追加し、そこから調整する）
export type Template = { id: string; name: string; note: string; items: string[] };

export const TEMPLATES: Template[] = [
  { id: 'desk-neck', name: '首・肩こり（デスクワーク）', note: '画面を見る時間が長い方に。1時間に1回の小休憩にも。', items: ['chin-tuck', 'shoulder-shrug', 'scapula-squeeze', 'shoulder-roll', 'neck-back-stretch', 'forearm-stretch'] },
  { id: 'posture-reset', name: '姿勢リセット（猫背・巻き肩）', note: '姿勢診断で「頭が前・背中が丸い」と出た方に。', items: ['wall-posture', 'chin-tuck', 'chest-open', 'wall-slide', 'towel-thoracic', 'pelvic-rock-sit'] },
  { id: 'lowback-gentle', name: '腰痛予防（やさしい）', note: '慢性の腰の重だるさに。痛みの強い時期は先生の指示を優先。', items: ['knees-to-chest', 'pelvic-tilt', 'draw-in', 'cat-cow', 'hamstring-chair', 'half-kneel-hip-flexor'] },
  { id: 'lowback-strong', name: '腰の再発予防（体幹）', note: '痛みが落ち着いてから。動ける身体づくりに。', items: ['bridge', 'bird-dog', 'knee-plank', 'dead-bug', 'side-lying-abduction'] },
  { id: 'knee-early', name: 'ひざの痛み（はじめの時期）', note: 'ひざへの負担が少ない運動から。', items: ['quad-set', 'seated-knee-ext', 'slr', 'inner-thigh-ball', 'ankle-pump'] },
  { id: 'knee-strength', name: 'ひざ・脚の筋力アップ', note: '階段・立ち上がりを楽に。', items: ['sit-to-stand', 'chair-squat', 'bridge', 'side-lying-abduction', 'calf-raise', 'single-leg-stand'] },
  { id: 'ankle-sprain', name: '足首ねんざ後（回復期）', note: '先生が「動かしてよい」と判断した時期から。', items: ['ankle-pump', 'towel-gather', 'calf-raise', 'toe-raise', 'calf-stretch-wall', 'single-leg-stand'] },
  { id: 'sports-core', name: '体幹・再発予防（スポーツ）', note: '部活・スポーツ復帰に向けて。', items: ['plank', 'side-plank', 'bird-dog', 'dead-bug', 'lunge', 'bridge'] },
  { id: 'relax-night', name: '自律神経・リラックス（寝る前）', note: '呼吸を深くして、身体をゆるめる。', items: ['belly-breath', 'child-pose', 'knees-to-chest', 'seated-reach', 'neck-side-stretch'] },
  { id: 'senior-fall', name: '転倒予防（シニア）', note: '椅子と壁を使って安全に。', items: ['sit-to-stand', 'marching-sit', 'calf-raise', 'toe-raise', 'single-leg-stand'] },
];
