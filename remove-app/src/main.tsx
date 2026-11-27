import React, { useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { IS_DEMO } from './config';
import { CloudPatient, CloudStaff, DemoPatient, DemoStaff } from './lib/backend';
import { StaffApp } from './staff/StaffApp';
import { AuthGate } from './staff/AuthGate';
import { PatientApp } from './patient/PatientApp';
import { storage } from './lib/util';

function Root() {
  const params = new URLSearchParams(location.search);
  let token = params.get('p') ?? (location.hash.match(/^#\/?p\/([0-9a-f]{20,64})/)?.[1] ?? null);
  // ホーム画面から開いたとき（URLに鍵が残らない端末）は、最後に開いたメニューを開く
  if (!token && !IS_DEMO && params.get('staff') === null) {
    const standalone = window.matchMedia?.('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone;
    const last = storage.get('hosaka-selfcare-last');
    if (standalone && last) token = last;
  }
  const patientBackend = useMemo(() => (IS_DEMO ? new DemoPatient() : new CloudPatient()), []);
  const staffBackend = useMemo(() => (IS_DEMO ? new DemoStaff() : new CloudStaff()), []);

  if (token) {
    // 患者さんの画面：ホーム画面に追加したときにこのURLのまま開けるよう、院内用のアプリ設定を外す
    document.querySelector('link[rel="manifest"]')?.remove();
    document.querySelector('meta[name="apple-mobile-web-app-title"]')?.setAttribute('content', 'Re:MOVE');
    return <PatientApp token={token} backend={patientBackend} />;
  }
  if (IS_DEMO) return <StaffApp backend={staffBackend} />;
  return <AuthGate><StaffApp backend={staffBackend} /></AuthGate>;
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><Root /></React.StrictMode>);

if ('serviceWorker' in navigator && location.protocol === 'https:' && !IS_DEMO) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('./sw.js').catch(() => undefined); });
}
