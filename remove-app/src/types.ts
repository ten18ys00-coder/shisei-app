import type { Area, Dose, Position, Purpose } from './data/exercises';

export type PlanItem = {
  id: string; // メニュー内の行ID（同じ運動を2回入れても区別できる）
  exId: string;
  reps?: number; sets?: number; hold?: number; seconds?: number; perDay?: number; sides?: boolean;
  note?: string;
};

export type Plan = {
  title: string;
  message: string;
  items: PlanItem[];
  updated_at?: string;
};

export type Patient = {
  id: string;
  label: string;
  memo: string;
  token: string;
  plan: Plan;
  archived: boolean;
  created_at: string;
  updated_at: string;
  posture_patient_id?: string | null; // 姿勢アプリの同じ患者さん
  proposal?: Proposal | null; // 姿勢分析からの提案
};

/** 姿勢アプリから届く「おすすめの運動」 */
export type Proposal = {
  from: 'posture' | 'gait';
  at: string;
  date?: string;
  type?: string;
  total?: number | null;
  findings?: { label: string; dir: string; st: 'ok' | 'wn' | 'ng' }[];
  items: { exId: string; note?: string; why?: string }[];
  unmapped?: string[];
};

/** 姿勢アプリの記録（名前なしの数値だけ） */
export type PostureRecord = { date: string; total: number | null; front: number | null; side: number | null; rot: number | null; type: string | null };

export type LogRow = {
  patient_id: string;
  day: string; // YYYY-MM-DD（日本時間）
  done: string[]; // PlanItem.id
  total: number;
  pain: number | null;
  note: string;
  updated_at?: string;
};

// 院でつけ足す運動・動画（ex_library の data）
export type CustomExercise = {
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
  animFrom?: string; // 動きを借りる運動のID（なければ動画のみ）
};
export type LibData = { video?: string; hidden?: boolean; custom?: CustomExercise; note?: string };
export type LibEntry = { id: string; data: LibData };

export type PatientView = {
  label: string;
  plan: Plan;
  library: Record<string, LibData>;
  logs: LogRow[];
  clinic: { name: string; tel: string; code: string };
};
