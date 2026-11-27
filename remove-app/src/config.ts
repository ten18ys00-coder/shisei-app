// Supabase（姿勢アプリ・栄養アプリと同じプロジェクト「hosaka-shisei」・東京リージョン）
// 公開用のキー（anon）。先生側のデータは行単位のアクセス制御（RLS）で院のアカウントだけが読み書きでき、
// 患者さん側はリンクの鍵（推測できない文字列）で、自分のメニューと記録だけを扱える。
export const SUPABASE_URL = 'https://gyvthlwsicjhrmszkvdc.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5dnRobHdzaWNqaHJtc3prdmRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUzOTQ0MTMsImV4cCI6MjExMDk3MDQxM30.Ooe7rkuqLAd_9JfvBMXDTG8JjIkeJYmvM-8FjEeM5Sg';
// 院のアカウント（姿勢アプリの院コード「hosaka」と同じ。パスコードも共通）
export const CLINIC_LOGIN_EMAIL = 'hosaka@shisei.hosaka-seikotsuin.com';
export const APP_NAME = 'Re:MOVE';
export const APP_BY = 'Structural Body Care'; // 院の英語表記
export const APP_TAGLINE = 'もう一度、思いどおり動ける身体へ。';
export const APP_VERSION = 'v1.0';

// 院ごとの連絡先（患者さんの画面に出す）
export const CLINIC_LINKS: Record<string, { line?: string }> = {
  hosaka: { line: 'https://lin.ee/VLrHaFw' },
};

export const IS_DEMO = import.meta.env.VITE_DEMO === '1' || (typeof location !== 'undefined' && new URLSearchParams(location.search).has('demo'));
