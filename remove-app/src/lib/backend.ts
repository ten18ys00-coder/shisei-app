// 保存先：本番＝Supabase、お試し＝この端末の中（localStorage）
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { CLINIC_LOGIN_EMAIL, SUPABASE_ANON_KEY, SUPABASE_URL } from '../config';
import type { LibData, LibEntry, LogRow, Patient, PatientView, Plan, PostureRecord } from '../types';
import { addDays, newToken, rid, storage, todayJST } from './util';
import { demoSeed } from '../data/demo';

export interface StaffBackend {
  kind: 'cloud' | 'demo';
  listPatients(): Promise<Patient[]>;
  createPatient(label: string, memo: string): Promise<Patient>;
  updatePatient(id: string, patch: Partial<Pick<Patient, 'label' | 'memo' | 'plan' | 'archived' | 'token' | 'proposal' | 'posture_patient_id'>>): Promise<Patient>;
  listPosture(posturePatientId: string): Promise<PostureRecord[]>;
  deletePatient(id: string): Promise<void>;
  listLogs(sinceDay: string): Promise<LogRow[]>;
  listLibrary(): Promise<LibEntry[]>;
  saveLibrary(id: string, data: LibData): Promise<void>;
  deleteLibrary(id: string): Promise<void>;
  subscribe(onChange: (what: 'logs' | 'patients') => void): () => void;
}

export interface PatientBackend {
  view(token: string): Promise<PatientView | null>;
  log(token: string, row: Omit<LogRow, 'patient_id'>): Promise<void>;
}

export const EMPTY_PLAN: Plan = { title: '', message: '', items: [] };

// ---------------- Supabase ----------------
let client: SupabaseClient | null = null;
export function supabase(): SupabaseClient {
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, storageKey: 'hosaka-selfcare-auth' },
    });
  }
  return client;
}

export async function signInWithPasscode(passcode: string): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    // 姿勢アプリと同じ決まり：6文字未満のパスコードは内部で長い形にしてから使う
    const password = passcode.length < 6 ? `pin-${passcode}-shisei` : passcode;
    const { error } = await supabase().auth.signInWithPassword({ email: CLINIC_LOGIN_EMAIL, password });
    if (!error) return { ok: true };
    const code = (error as { code?: string }).code ?? '';
    const status = error.status ?? 0;
    if (code === 'invalid_credentials' || /invalid login credentials/i.test(error.message)) return { ok: false, message: 'パスコードが違います。' };
    if (status === 429 || code === 'over_request_rate_limit') return { ok: false, message: '試行回数が多すぎます。しばらく待ってからお試しください。' };
    if (status === 0 || status >= 500 || /fetch|network/i.test(error.name + error.message)) return { ok: false, message: 'サーバーに接続できません。通信状態を確認してください。' };
    return { ok: false, message: `ログインできませんでした（${status} ${error.message}）` };
  } catch {
    return { ok: false, message: 'インターネットに接続できません。通信状態を確認してください。' };
  }
}

const PCOLS = 'id,label,memo,token,plan,archived,created_at,updated_at,posture_patient_id,proposal';
const normPatient = (r: Record<string, unknown>): Patient => ({
  id: String(r.id), label: String(r.label ?? ''), memo: String(r.memo ?? ''), token: String(r.token ?? ''),
  plan: { ...EMPTY_PLAN, ...((r.plan as Plan) ?? {}) }, archived: !!r.archived,
  created_at: String(r.created_at ?? ''), updated_at: String(r.updated_at ?? ''),
  posture_patient_id: r.posture_patient_id ? String(r.posture_patient_id) : null,
  proposal: (r.proposal as Patient['proposal']) ?? null,
});
const num = (v: unknown) => (typeof v === 'number' && isFinite(v) ? v : null);
export function normPosture(date: string, d: Record<string, unknown>): PostureRecord {
  const sc = (d.scores ?? {}) as Record<string, unknown>;
  return { date, total: num(sc.total), front: num(sc.front), side: num(sc.side), rot: num(sc.rot), type: typeof d.type === 'string' ? d.type : null };
}
const normLog = (r: Record<string, unknown>): LogRow => ({
  patient_id: String(r.patient_id ?? ''), day: String(r.day), done: Array.isArray(r.done) ? (r.done as string[]) : [],
  total: Number(r.total ?? 0), pain: r.pain === null || r.pain === undefined ? null : Number(r.pain), note: String(r.note ?? ''),
  updated_at: r.updated_at ? String(r.updated_at) : undefined,
});
function fail(e: { message: string } | null, what: string): never {
  throw new Error(`${what}できませんでした（${e?.message ?? '不明なエラー'}）`);
}

export class CloudStaff implements StaffBackend {
  kind = 'cloud' as const;
  async listPatients() {
    const { data, error } = await supabase().from('ex_patients').select(PCOLS).order('updated_at', { ascending: false });
    if (error) fail(error, '患者さんの一覧を読み込み');
    return (data ?? []).map(normPatient);
  }
  async createPatient(label: string, memo: string) {
    const { data, error } = await supabase().from('ex_patients').insert({ label, memo, plan: EMPTY_PLAN }).select(PCOLS).single();
    if (error) fail(error, '登録');
    return normPatient(data);
  }
  async updatePatient(id: string, patch: Partial<Patient>) {
    const { data, error } = await supabase().from('ex_patients').update(patch).eq('id', id).select(PCOLS).single();
    if (error) fail(error, '保存');
    return normPatient(data);
  }
  async deletePatient(id: string) {
    const { error } = await supabase().from('ex_patients').delete().eq('id', id);
    if (error) fail(error, '削除');
  }
  async listLogs(sinceDay: string) {
    const out: LogRow[] = [];
    const page = 1000;
    for (let from = 0; ; from += page) {
      const { data, error } = await supabase().from('ex_logs').select('patient_id,day,done,total,pain,note,updated_at').gte('day', sinceDay).order('day').range(from, from + page - 1);
      if (error) fail(error, '記録を読み込み');
      out.push(...(data ?? []).map(normLog));
      if (!data || data.length < page) break;
    }
    return out;
  }
  async listPosture(posturePatientId: string) {
    const { data, error } = await supabase().from('sessions').select('date,data').eq('patient_id', posturePatientId).order('date');
    if (error) fail(error, '姿勢分析の記録を読み込み');
    return (data ?? []).map((r) => normPosture(String(r.date), (r.data ?? {}) as Record<string, unknown>));
  }
  async listLibrary() {
    const { data, error } = await supabase().from('ex_library').select('id,data');
    if (error) fail(error, 'ライブラリを読み込み');
    return (data ?? []) as LibEntry[];
  }
  async saveLibrary(id: string, d: LibData) {
    const { error } = await supabase().from('ex_library').upsert({ id, data: d }, { onConflict: 'clinic_id,id' });
    if (error) fail(error, '保存');
  }
  async deleteLibrary(id: string) {
    const { error } = await supabase().from('ex_library').delete().eq('id', id);
    if (error) fail(error, '削除');
  }
  subscribe(onChange: (what: 'logs' | 'patients') => void) {
    const ch = supabase()
      .channel('selfcare')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ex_logs' }, () => onChange('logs'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ex_patients' }, () => onChange('patients'))
      .subscribe();
    const vis = () => { if (document.visibilityState === 'visible') onChange('logs'); };
    document.addEventListener('visibilitychange', vis);
    return () => { supabase().removeChannel(ch); document.removeEventListener('visibilitychange', vis); };
  }
}

export class CloudPatient implements PatientBackend {
  async view(token: string) {
    const { data, error } = await supabase().rpc('ex_patient_view', { p_token: token });
    if (error) throw new Error(error.message);
    if (!data) return null;
    const v = data as PatientView;
    return { ...v, plan: { ...EMPTY_PLAN, ...(v.plan ?? {}) }, logs: (v.logs ?? []).map((r) => normLog(r as unknown as Record<string, unknown>)) };
  }
  async log(token: string, row: Omit<LogRow, 'patient_id'>) {
    const { error } = await supabase().rpc('ex_patient_log', {
      p_token: token, p_day: row.day, p_done: row.done, p_total: row.total, p_pain: row.pain, p_note: row.note,
    });
    if (error) throw new Error(error.message);
  }
}

// ---------------- お試し（端末内） ----------------
type DemoDB = { patients: Patient[]; logs: LogRow[]; library: LibEntry[]; posture?: Record<string, PostureRecord[]> };
const DEMO_KEY = 'hosaka-selfcare-demo-v2';
function loadDemo(): DemoDB {
  const raw = storage.get(DEMO_KEY);
  if (raw) { try { return JSON.parse(raw) as DemoDB; } catch { /* 作り直す */ } }
  const db = demoSeed();
  storage.set(DEMO_KEY, JSON.stringify(db));
  return db;
}
const listeners = new Set<(w: 'logs' | 'patients') => void>();
function saveDemo(db: DemoDB, what: 'logs' | 'patients') {
  storage.set(DEMO_KEY, JSON.stringify(db));
  listeners.forEach((f) => f(what));
}
export function resetDemo() { storage.del(DEMO_KEY); }

export class DemoStaff implements StaffBackend {
  kind = 'demo' as const;
  async listPatients() { return [...loadDemo().patients].sort((a, b) => b.updated_at.localeCompare(a.updated_at)); }
  async createPatient(label: string, memo: string) {
    const db = loadDemo();
    const now = new Date().toISOString();
    const p: Patient = { id: rid(12), label, memo, token: newToken(), plan: { ...EMPTY_PLAN }, archived: false, created_at: now, updated_at: now };
    db.patients.push(p); saveDemo(db, 'patients');
    return p;
  }
  async updatePatient(id: string, patch: Partial<Patient>) {
    const db = loadDemo();
    const i = db.patients.findIndex((p) => p.id === id);
    if (i < 0) throw new Error('見つかりません');
    db.patients[i] = { ...db.patients[i], ...patch, updated_at: new Date().toISOString() };
    saveDemo(db, 'patients');
    return db.patients[i];
  }
  async deletePatient(id: string) {
    const db = loadDemo();
    db.patients = db.patients.filter((p) => p.id !== id);
    db.logs = db.logs.filter((l) => l.patient_id !== id);
    saveDemo(db, 'patients');
  }
  async listLogs(sinceDay: string) { return loadDemo().logs.filter((l) => l.day >= sinceDay); }
  async listPosture(posturePatientId: string) { return loadDemo().posture?.[posturePatientId] ?? []; }
  async listLibrary() { return loadDemo().library; }
  async saveLibrary(id: string, data: LibData) {
    const db = loadDemo();
    db.library = [...db.library.filter((e) => e.id !== id), { id, data }];
    saveDemo(db, 'patients');
  }
  async deleteLibrary(id: string) {
    const db = loadDemo();
    db.library = db.library.filter((e) => e.id !== id);
    saveDemo(db, 'patients');
  }
  subscribe(onChange: (what: 'logs' | 'patients') => void) {
    listeners.add(onChange);
    return () => { listeners.delete(onChange); };
  }
}

export class DemoPatient implements PatientBackend {
  async view(token: string) {
    const db = loadDemo();
    const p = db.patients.find((x) => x.token === token && !x.archived);
    if (!p) return null;
    const ids = new Set(p.plan.items.map((i) => i.exId));
    const library = Object.fromEntries(db.library.filter((e) => ids.has(e.id)).map((e) => [e.id, e.data]));
    const since = addDays(todayJST(), -90);
    return {
      label: p.label, plan: p.plan, library, logs: db.logs.filter((l) => l.patient_id === p.id && l.day >= since),
      clinic: { name: 'ほさか整骨院', tel: '028-666-6141', code: 'hosaka' },
    };
  }
  async log(token: string, row: Omit<LogRow, 'patient_id'>) {
    const db = loadDemo();
    const p = db.patients.find((x) => x.token === token);
    if (!p) throw new Error('not_found');
    const i = db.logs.findIndex((l) => l.patient_id === p.id && l.day === row.day);
    const r: LogRow = { ...row, patient_id: p.id, updated_at: new Date().toISOString() };
    if (i >= 0) db.logs[i] = r; else db.logs.push(r);
    saveDemo(db, 'logs');
  }
}

/** 先生の画面の中で患者さんの画面を確認するとき（記録は書き込まない） */
export class PreviewPatient implements PatientBackend {
  constructor(private inner: PatientBackend) {}
  view(token: string) { return this.inner.view(token); }
  async log() { /* 確認用なので保存しない */ }
}
