/**
 * kt.js – Fusion Shared Library
 * Common utilities for lehrer.html and schueler.html
 */

const KT_KEY = 'fusion_v4';

// ─── Storage ────────────────────────────────────────────────────────────────

function ktLoad() {
  try {
    return JSON.parse(localStorage.getItem(KT_KEY)) || ktEmpty();
  } catch { return ktEmpty(); }
}

function ktSave(data) {
  localStorage.setItem(KT_KEY, JSON.stringify(data));
}

function ktEmpty() {
  return { tests: [], students: [], submissions: [], teachers: [], templates: [] };
}

// ─── IDs ────────────────────────────────────────────────────────────────────

function ktId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function ktCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

// ─── Score ──────────────────────────────────────────────────────────────────

function ktCalcScore(test, answers) {
  let earned = 0, total = 0;
  (test.pages || []).forEach(page => {
    (page.elements || []).forEach(el => {
      if (el.type === 'mc') {
        const pts = el.points || 1;
        total += pts;
        if (answers[el.id] === el.correct) earned += pts;
      } else if (el.type === 'multi') {
        const pts = el.points || 1;
        total += pts;
        const correct = (el.correct || []).slice().sort().join(',');
        const given = (answers[el.id] || []).slice().sort().join(',');
        if (correct === given) earned += pts;
      }
    });
  });
  return { earned, total };
}

// ─── Time ────────────────────────────────────────────────────────────────────

function ktFmtTime(sec) {
  if (sec < 0) sec = 0;
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// ─── Toast ──────────────────────────────────────────────────────────────────

function ktToast(msg, type = 'info') {
  let wrap = document.getElementById('kt-toasts');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.id = 'kt-toasts';
    wrap.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:10px;pointer-events:none;';
    document.body.appendChild(wrap);
  }
  const t = document.createElement('div');
  const icons = { info: 'ℹ️', success: '✅', error: '❌', warning: '⚠️' };
  t.className = `kt-toast kt-toast-${type}`;
  t.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${msg}</span>`;
  t.style.cssText = 'pointer-events:all;display:flex;align-items:center;gap:10px;padding:12px 18px;border-radius:12px;font-size:14px;font-family:"DM Sans",sans-serif;font-weight:500;box-shadow:0 8px 32px rgba(0,0,0,.4);animation:ktSlideIn .3s ease;max-width:360px;';
  const colors = {
    info:    'background:#1e2a45;border:1px solid #334;color:#c8d0e0;',
    success: 'background:#0d2e1f;border:1px solid #1a5c36;color:#6ee7b7;',
    error:   'background:#2e0d0d;border:1px solid #5c1a1a;color:#fca5a5;',
    warning: 'background:#2e1f0d;border:1px solid #5c3a1a;color:#fcd34d;',
  };
  t.style.cssText += colors[type] || colors.info;
  wrap.appendChild(t);
  if (!document.getElementById('kt-toast-style')) {
    const s = document.createElement('style');
    s.id = 'kt-toast-style';
    s.textContent = '@keyframes ktSlideIn{from{transform:translateX(120%);opacity:0}to{transform:translateX(0);opacity:1}}@keyframes ktSlideOut{from{transform:translateX(0);opacity:1}to{transform:translateX(120%);opacity:0}}';
    document.head.appendChild(s);
  }
  setTimeout(() => {
    t.style.animation = 'ktSlideOut .3s ease forwards';
    setTimeout(() => t.remove(), 300);
  }, 3500);
}

// ─── File Download ───────────────────────────────────────────────────────────

function ktDownload(filename, content, mime = 'text/plain') {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], { type: mime }));
  a.download = filename;
  a.click();
}

// ─── SHA-256 ─────────────────────────────────────────────────────────────────

async function ktHash(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ─── Admin Check ─────────────────────────────────────────────────────────────

// Admin creds: name="herr samuel singh", city="lüdenscheid", pw="SamuelForever358!"
const ADMIN_HASHES = {
  name: '3e2f1e4b3c2a8d7e6f5c4b3a2d1e0f9c8b7a6d5e4c3b2a1f0e9d8c7b6a5d4e3', // placeholder, computed at runtime
  city: '',
  pw: ''
};

let _adminHashesReady = false;
async function ktInitAdminHashes() {
  if (_adminHashesReady) return;
  ADMIN_HASHES.name = await ktHash('herr samuel singh');
  ADMIN_HASHES.city = await ktHash('lüdenscheid');
  ADMIN_HASHES.pw   = await ktHash('SamuelForever358!');
  _adminHashesReady = true;
}

async function ktIsAdmin(name, city, pw) {
  await ktInitAdminHashes();
  const [hn, hc, hp] = await Promise.all([ktHash(name.toLowerCase().trim()), ktHash(city.toLowerCase().trim()), ktHash(pw)]);
  return hn === ADMIN_HASHES.name && hc === ADMIN_HASHES.city && hp === ADMIN_HASHES.pw;
}

// ─── Grade Color ─────────────────────────────────────────────────────────────

function ktGradeColor(grade) {
  const g = parseFloat(grade);
  if (g <= 1.5) return '#6ee7b7';
  if (g <= 2.5) return '#93c5fd';
  if (g <= 3.5) return '#fde68a';
  if (g <= 4.5) return '#fdba74';
  return '#fca5a5';
}

function ktGradeLabel(grade) {
  const map = {
    '1+':'1+','1':'1','1-':'1−','2+':'2+','2':'2','2-':'2−',
    '3+':'3+','3':'3','3-':'3−','4+':'4+','4':'4','4-':'4−',
    '5+':'5+','5':'5','5-':'5−','6':'6'
  };
  return map[grade] || grade;
}

// ─── Logo Injection ───────────────────────────────────────────────────────────

function ktInjectLogos() {
  document.querySelectorAll('.logo-mark').forEach(el => {
    if (el.querySelector('svg')) return;
    el.innerHTML = `
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" rx="10" fill="url(#lg)"/>
        <path d="M9 23L16 9L23 23" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M11.5 18.5H20.5" stroke="white" stroke-width="2" stroke-linecap="round" opacity=".6"/>
        <defs><linearGradient id="lg" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stop-color="#7c3aed"/><stop offset="1" stop-color="#4f46e5"/>
        </linearGradient></defs>
      </svg>`;
  });
}

// ─── Demo Data ────────────────────────────────────────────────────────────────

async function ktLoadDemoIfNeeded() {
  const data = ktLoad();
  if (data._demoLoaded) return;

  const testId = ktId();
  const s1 = ktId(), s2 = ktId(), s3 = ktId();
  const sub1 = ktId(), sub2 = ktId(), sub3 = ktId();

  const demoTest = {
    id: testId,
    title: 'Demo-Test: Grundlagen der Informatik',
    subject: 'Informatik',
    class: '10a',
    status: 'ended',
    code: 'DEMO01',
    createdAt: Date.now() - 86400000 * 3,
    timer: 45,
    pages: [{
      id: ktId(),
      background: 'lined',
      elements: [
        { id: 'e1', type: 'heading', level: 'h1', text: 'Grundlagen der Informatik – Klassenarbeit' },
        { id: 'e2', type: 'text', text: 'Lies alle Aufgaben sorgfältig durch. Viel Erfolg!' },
        { id: 'e3', type: 'mc', label: 'Was ist ein Algorithmus?',
          options: ['Eine Programmiersprache', 'Eine schrittweise Handlungsvorschrift', 'Ein Computerprogramm', 'Eine Datenstruktur'],
          correct: 1, points: 2 },
        { id: 'e4', type: 'mc', label: 'Welche Schnittstelle verbindet Hardware und Software?',
          options: ['API', 'GUI', 'Betriebssystem', 'Compiler'],
          correct: 2, points: 2 },
        { id: 'e5', type: 'multi', label: 'Welche der folgenden sind Programmiersprachen?',
          options: ['Python', 'HTML', 'Java', 'Linux', 'JavaScript'],
          correct: [0, 2, 4], points: 3 },
        { id: 'e6', type: 'free', label: 'Erkläre den Unterschied zwischen Compiler und Interpreter.', rows: 4 }
      ]
    }]
  };

  const students = [
    { id: s1, name: 'Anna Müller',   code: 'DEMO01', joinedAt: Date.now() - 86400000 * 3 + 60000 },
    { id: s2, name: 'Ben Schmidt',   code: 'DEMO01', joinedAt: Date.now() - 86400000 * 3 + 90000 },
    { id: s3, name: 'Clara Weber',   code: 'DEMO01', joinedAt: Date.now() - 86400000 * 3 + 120000 },
  ];

  const makeAnswers = (mc1, mc2, multi, free) => ({
    e3: mc1, e4: mc2, e5: multi, e6: free
  });

  const subs = [
    {
      id: sub1, testId, studentId: s1, studentName: 'Anna Müller',
      submittedAt: Date.now() - 86400000 * 3 + 2700000,
      answers: makeAnswers(1, 2, [0,2,4], 'Ein Compiler übersetzt den gesamten Quellcode auf einmal in Maschinencode, während ein Interpreter den Code Zeile für Zeile ausführt.'),
      score: { earned: 7, total: 7 }, corrected: true,
      grade: '1', feedback: 'Hervorragende Arbeit! Alle Antworten korrekt.',
      manualScores: { e6: 2 }, comments: { e6: 'Sehr präzise erklärt.' }
    },
    {
      id: sub2, testId, studentId: s2, studentName: 'Ben Schmidt',
      submittedAt: Date.now() - 86400000 * 3 + 3000000,
      answers: makeAnswers(1, 1, [0,2], 'Ein Compiler übersetzt alles, ein Interpreter macht das schrittweise.'),
      score: { earned: 3, total: 7 }, corrected: true,
      grade: '4', feedback: 'Grundlagen vorhanden, aber noch Übungsbedarf.',
      manualScores: { e6: 1 }, comments: { e6: 'Ansatz richtig, aber unvollständig.' }
    },
    {
      id: sub3, testId, studentId: s3, studentName: 'Clara Weber',
      submittedAt: Date.now() - 86400000 * 3 + 2400000,
      answers: makeAnswers(1, 2, [0,2,4], 'Compiler: gesamter Code wird übersetzt. Interpreter: Zeile für Zeile ausgeführt. Compiler sind schneller bei der Ausführung.'),
      score: { earned: 6, total: 7 }, corrected: false,
      grade: null, feedback: ''
    }
  ];

  data.tests.push(demoTest);
  data.students.push(...students);
  data.submissions.push(...subs);
  data._demoLoaded = true;
  ktSave(data);
}

// ─── Tutorial System ──────────────────────────────────────────────────────────

const KT_TUT_KEY = 'fusion_tutorials';

function ktTutSeen(id) {
  const seen = JSON.parse(localStorage.getItem(KT_TUT_KEY) || '[]');
  return seen.includes(id);
}

function ktTutMarkSeen(id) {
  const seen = JSON.parse(localStorage.getItem(KT_TUT_KEY) || '[]');
  if (!seen.includes(id)) { seen.push(id); localStorage.setItem(KT_TUT_KEY, JSON.stringify(seen)); }
}

function ktTutReset() {
  localStorage.removeItem(KT_TUT_KEY);
}

/**
 * Show a tutorial sequence.
 * @param {string} id - unique tutorial id
 * @param {Array<{selector:string, emoji:string, title:string, desc:string}>} steps
 */
function ktTutorial(id, steps) {
  if (ktTutSeen(id)) return;

  let current = 0;
  const overlay = document.createElement('div');
  overlay.id = 'kt-tut-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:10000;pointer-events:none;';

  const highlight = document.createElement('div');
  highlight.style.cssText = 'position:fixed;border-radius:12px;box-shadow:0 0 0 9999px rgba(0,0,0,.65);transition:all .35s ease;pointer-events:none;z-index:10001;border:2px solid rgba(167,139,250,.8);';

  const bubble = document.createElement('div');
  bubble.style.cssText = 'position:fixed;z-index:10002;background:#1a1f35;border:1px solid rgba(167,139,250,.4);border-radius:16px;padding:20px 24px;max-width:320px;box-shadow:0 20px 60px rgba(0,0,0,.5);pointer-events:all;font-family:"DM Sans",sans-serif;';

  document.body.appendChild(overlay);
  overlay.appendChild(highlight);
  overlay.appendChild(bubble);
  overlay.style.pointerEvents = 'all';

  function render() {
    const step = steps[current];
    const el = document.querySelector(step.selector);
    const rect = el ? el.getBoundingClientRect() : { top: window.innerHeight/2-60, left: window.innerWidth/2-160, width: 320, height: 60 };
    const pad = 8;
    highlight.style.top = (rect.top - pad) + 'px';
    highlight.style.left = (rect.left - pad) + 'px';
    highlight.style.width = (rect.width + pad*2) + 'px';
    highlight.style.height = (rect.height + pad*2) + 'px';

    // position bubble
    let bTop = rect.bottom + pad + 16;
    if (bTop + 200 > window.innerHeight) bTop = rect.top - 220;
    let bLeft = rect.left;
    if (bLeft + 340 > window.innerWidth) bLeft = window.innerWidth - 350;

    bubble.style.top = Math.max(10, bTop) + 'px';
    bubble.style.left = Math.max(10, bLeft) + 'px';

    bubble.innerHTML = `
      <div style="font-size:28px;margin-bottom:8px">${step.emoji}</div>
      <div style="font-family:'Fraunces',serif;font-size:16px;font-weight:700;color:#e2e8f0;margin-bottom:6px">${step.title}</div>
      <div style="font-size:13px;color:#94a3b8;line-height:1.6;margin-bottom:16px">${step.desc}</div>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:12px;color:#64748b">${current+1} / ${steps.length}</span>
        <div style="display:flex;gap:8px">
          ${current > 0 ? `<button onclick="window._ktTutPrev()" style="padding:6px 14px;border-radius:8px;border:1px solid rgba(167,139,250,.3);background:transparent;color:#a78bfa;font-size:13px;cursor:pointer">Zurück</button>` : ''}
          <button onclick="window._ktTutSkip()" style="padding:6px 14px;border-radius:8px;border:none;background:transparent;color:#64748b;font-size:13px;cursor:pointer">Überspringen</button>
          <button onclick="window._ktTutNext()" style="padding:6px 14px;border-radius:8px;border:none;background:linear-gradient(135deg,#7c3aed,#6366f1);color:white;font-size:13px;font-weight:600;cursor:pointer">${current === steps.length-1 ? 'Fertig' : 'Weiter'}</button>
        </div>
      </div>`;
  }

  window._ktTutNext = () => {
    if (current < steps.length - 1) { current++; render(); }
    else { ktTutMarkSeen(id); overlay.remove(); }
  };
  window._ktTutPrev = () => { if (current > 0) { current--; render(); } };
  window._ktTutSkip = () => { ktTutMarkSeen(id); overlay.remove(); };

  setTimeout(render, 400);
}

// ─── QR Code (simple inline SVG generator) ───────────────────────────────────

// Minimal QR-like visual (not a real QR code, just decorative placeholder with code embedded)
function ktQRPlaceholder(code) {
  // We use a data URL from a real QR lib is too heavy; instead render a styled code display
  return `<div style="display:inline-flex;flex-direction:column;align-items:center;gap:12px">
    <div style="width:140px;height:140px;background:white;border-radius:12px;display:flex;align-items:center;justify-content:center;padding:12px">
      <svg width="116" height="116" viewBox="0 0 116 116" xmlns="http://www.w3.org/2000/svg">
        ${ktQRSvg(code)}
      </svg>
    </div>
    <div style="font-family:'DM Mono',monospace;font-size:24px;font-weight:700;letter-spacing:.2em;color:#a78bfa">${code}</div>
  </div>`;
}

function ktQRSvg(text) {
  // Simple visual QR-like grid based on text hash
  const cells = 21;
  const size = Math.floor(116 / cells);
  let hash = 0;
  for (let i = 0; i < text.length; i++) hash = (hash * 31 + text.charCodeAt(i)) | 0;
  let out = '';
  // Fixed finder patterns
  const fixed = new Set();
  for (let r = 0; r < 7; r++) for (let c = 0; c < 7; c++) {
    if (r===0||r===6||c===0||c===6||(r>=2&&r<=4&&c>=2&&c<=4)) fixed.add(`${r},${c}`);
    if (r===0||r===6||c===0||c===6||(r>=2&&r<=4&&c>=2&&c<=4)) fixed.add(`${r},${c+14}`);
    if (r===0||r===6||c===0||c===6||(r>=2&&r<=4&&c>=2&&c<=4)) fixed.add(`${r+14},${c}`);
  }
  for (let r = 0; r < cells; r++) {
    for (let c = 0; c < cells; c++) {
      let on = fixed.has(`${r},${c}`);
      if (!on) {
        const v = (hash ^ (r * 73856093) ^ (c * 19349663)) & 1;
        on = v === 1;
      }
      if (on) out += `<rect x="${c*size+1}" y="${r*size+1}" width="${size-1}" height="${size-1}" fill="#1a1535" rx="1"/>`;
    }
  }
  return out;
}

// ─── Init ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  ktInjectLogos();
});
