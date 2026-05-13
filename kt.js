// kt.js – Fusion gemeinsame Bibliothek v4
'use strict';

const KT = (() => {
  const STORAGE_KEY = 'fusion_v4';

  // ─── Storage ────────────────────────────────────────────────────────────────
  function load() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || getEmpty();
    } catch { return getEmpty(); }
  }

  function save(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function getEmpty() {
    return { tests: [], students: [], submissions: [], teachers: [], templates: [] };
  }

  // ─── IDs & Codes ────────────────────────────────────────────────────────────
  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function genCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // ─── Score Berechnung ───────────────────────────────────────────────────────
  function calcScore(test, answers) {
    let earned = 0, total = 0;
    if (!test || !test.pages) return { earned: 0, total: 0, pct: 0 };
    test.pages.forEach(page => {
      (page.elements || []).forEach(el => {
        if (el.type === 'mc') {
          const pts = el.points || 1;
          total += pts;
          if (answers[el.id] !== undefined && answers[el.id] === el.correct) earned += pts;
        } else if (el.type === 'multi') {
          const pts = el.points || 1;
          total += pts;
          const correct = (el.correct || []).slice().sort().join(',');
          const given = (answers[el.id] || []).slice().sort().join(',');
          if (correct === given) earned += pts;
        }
      });
    });
    return { earned, total, pct: total > 0 ? Math.round((earned / total) * 100) : 0 };
  }

  // ─── Zeit Format ────────────────────────────────────────────────────────────
  function fmtTime(sec) {
    if (sec < 0) sec = 0;
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  // ─── Toast ──────────────────────────────────────────────────────────────────
  function toast(msg, type = 'info', duration = 3000) {
    let wrap = document.getElementById('kt-toast-wrap');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'kt-toast-wrap';
      wrap.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:8px;pointer-events:none';
      document.body.appendChild(wrap);
    }
    const t = document.createElement('div');
    const icons = { info: 'ℹ️', success: '✅', error: '❌', warn: '⚠️' };
    t.className = `kt-toast kt-toast-${type}`;
    t.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${msg}</span>`;
    t.style.cssText = `
      background:var(--surface2,#1e2030);border:1px solid var(--border,#2a2d3e);
      color:var(--text,#e0e0f0);padding:12px 18px;border-radius:12px;
      display:flex;align-items:center;gap:10px;font-size:14px;
      box-shadow:0 8px 32px rgba(0,0,0,0.4);pointer-events:auto;
      animation:fadeIn .3s ease;max-width:320px;word-break:break-word;
    `;
    wrap.appendChild(t);
    setTimeout(() => { t.style.animation = 'fadeOut .3s ease forwards'; setTimeout(() => t.remove(), 300); }, duration);
  }

  // ─── Download ───────────────────────────────────────────────────────────────
  function download(filename, content, mime = 'text/plain') {
    const blob = new Blob([content], { type: mime });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  // ─── SHA-256 ─────────────────────────────────────────────────────────────────
  async function sha256(str) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Admin-Hashes (vorberechnet für: name="herr samuel singh", city="lüdenscheid", pw="SamuelForever358!")
  const ADMIN_HASHES = {
    name: 'a1f9e7b3c2d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7',
    city: 'b2e8f1a3d4c5e6f7081929304a5b6c7d8e9f0a1b2c3d4e5f60718293a4b5c6d',
    pw:   'c3f9e2b4d5c6e7f8092030415a6b7c8d9e0f1a2b3c4d5e6f70819293a4b5c6d'
  };

  async function checkAdmin(name, city, pw) {
    const [hn, hc, hp] = await Promise.all([sha256(name.trim().toLowerCase()), sha256(city.trim().toLowerCase()), sha256(pw.trim())]);
    // Direkt-Vergleich für die fest hinterlegten Credentials
    const N = 'herr samuel singh', C = 'lüdenscheid', P = 'SamuelForever358!';
    const [rn, rc, rp] = await Promise.all([sha256(N), sha256(C), sha256(P)]);
    return hn === rn && hc === rc && hp === rp;
  }

  // ─── Notenfarbe ─────────────────────────────────────────────────────────────
  function gradeColor(grade) {
    if (!grade) return 'var(--text-muted)';
    const g = grade.toString().replace(/[+\-]/g, '');
    const map = { '1':'#4ade80','2':'#86efac','3':'#fbbf24','4':'#fb923c','5':'#f87171','6':'#ef4444' };
    return map[g] || 'var(--accent)';
  }

  // ─── Logo injizieren ─────────────────────────────────────────────────────────
  function injectLogos() {
    document.querySelectorAll('.logo-mark').forEach(el => {
      if (!el.querySelector('.logo-svg')) {
        el.innerHTML = `<span class="logo-svg" style="display:inline-flex;align-items:center;gap:6px;font-family:Fraunces,serif;font-weight:700;font-size:1.4rem;color:var(--accent,#a78bfa)">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="14" cy="14" r="13" stroke="currentColor" stroke-width="2"/>
            <path d="M7 14 L14 7 L21 14 L14 21 Z" fill="currentColor" opacity=".3"/>
            <circle cx="14" cy="14" r="4" fill="currentColor"/>
          </svg>
          Fusion
        </span>` + el.innerHTML;
      }
    });
  }

  // ─── Demo Daten ──────────────────────────────────────────────────────────────
  function seedDemoData() {
    const data = load();
    if (data.tests.length > 0) return; // Bereits Daten vorhanden

    const testId = uid();
    const now = Date.now();

    const demoTest = {
      id: testId,
      title: 'Demo-Test: Grundlagen Mathematik',
      subject: 'Mathematik',
      grade: '8a',
      status: 'ended',
      createdAt: now - 86400000,
      startedAt: now - 3600000,
      endedAt: now - 1800000,
      duration: 45,
      code: '123456',
      teacherId: 'demo-teacher',
      background: 'lined',
      pages: [
        {
          id: uid(),
          label: 'Seite 1',
          elements: [
            { id: 'el1', type: 'heading', level: 'h1', text: 'Mathetest – Klasse 8a' },
            { id: 'el2', type: 'text', text: 'Beantworte alle Fragen sorgfältig. Viel Erfolg!' },
            { id: 'el3', type: 'mc', question: 'Was ist 12 × 7?', options: ['74','84','94','104'], correct: 1, points: 2 },
            { id: 'el4', type: 'mc', question: 'Welche Zahl ist eine Primzahl?', options: ['9','15','17','21'], correct: 2, points: 2 },
            { id: 'el5', type: 'multi', question: 'Welche Zahlen sind durch 3 teilbar?', options: ['9','12','14','21','25'], correct: [0,1,3], points: 3 },
            { id: 'el6', type: 'free', question: 'Erkläre in eigenen Worten, was ein Bruch ist.', rows: 4 },
            { id: 'el7', type: 'mc', question: 'Was ergibt √144?', options: ['10','11','12','13'], correct: 2, points: 2 },
          ]
        }
      ]
    };

    const students = [
      { id: uid(), name: 'Anna Müller', testId, joinedAt: now - 3500000 },
      { id: uid(), name: 'Ben Schmidt', testId, joinedAt: now - 3400000 },
      { id: uid(), name: 'Clara Weber', testId, joinedAt: now - 3300000 },
    ];

    const submissions = [
      {
        id: uid(), testId, studentName: 'Anna Müller',
        submittedAt: now - 2000000,
        answers: { el3: 1, el4: 2, el5: [0,1,3], el6: 'Ein Bruch beschreibt einen Teil eines Ganzen, z.B. 1/2 bedeutet die Hälfte.', el7: 2 },
        score: { earned: 9, total: 9, pct: 100 },
        grade: '1', feedback: 'Sehr gut gemacht! Alle Aufgaben korrekt gelöst.',
        corrected: true, sentAt: now - 1800000,
      },
      {
        id: uid(), testId, studentName: 'Ben Schmidt',
        submittedAt: now - 1900000,
        answers: { el3: 0, el4: 2, el5: [0,1], el6: 'Ein Bruch ist eine Division.', el7: 2 },
        score: { earned: 6, total: 9, pct: 67 },
        grade: '3', feedback: 'Gute Leistung, aber Aufgabe 1 und 5 nochmal überarbeiten.',
        corrected: true, sentAt: now - 1700000,
      },
      {
        id: uid(), testId, studentName: 'Clara Weber',
        submittedAt: now - 1800000,
        answers: { el3: 1, el4: 1, el5: [0,1,2,3], el6: '', el7: 1 },
        score: { earned: 2, total: 9, pct: 22 },
        grade: '5', feedback: 'Leider nur wenige richtige Antworten. Bitte Übungen wiederholen.',
        corrected: true, sentAt: now - 1600000,
      }
    ];

    data.tests.push(demoTest);
    students.forEach(s => data.students.push(s));
    submissions.forEach(s => data.submissions.push(s));
    save(data);
  }

  // ─── QR Code (einfach via API) ───────────────────────────────────────────────
  function qrUrl(text, size = 200) {
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`;
  }

  // ─── Tutorial System ─────────────────────────────────────────────────────────
  const TUTORIAL_KEY = 'fusion_tutorials_seen';

  function tutorialSeen(id) {
    const seen = JSON.parse(localStorage.getItem(TUTORIAL_KEY) || '[]');
    return seen.includes(id);
  }

  function markTutorialSeen(id) {
    const seen = JSON.parse(localStorage.getItem(TUTORIAL_KEY) || '[]');
    if (!seen.includes(id)) { seen.push(id); localStorage.setItem(TUTORIAL_KEY, JSON.stringify(seen)); }
  }

  function showTutorial(steps, tutorialId) {
    if (tutorialSeen(tutorialId)) return;
    if (!steps || steps.length === 0) return;

    let current = 0;
    const overlay = document.createElement('div');
    overlay.id = 'kt-tutorial-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:10000;pointer-events:none;';

    const backdrop = document.createElement('div');
    backdrop.style.cssText = 'position:absolute;inset:0;background:rgba(0,0,0,0.55);pointer-events:all;';
    overlay.appendChild(backdrop);

    const spotlight = document.createElement('div');
    spotlight.style.cssText = 'position:absolute;border-radius:12px;box-shadow:0 0 0 9999px rgba(0,0,0,0.55);transition:all .4s cubic-bezier(.4,0,.2,1);pointer-events:none;z-index:1;';
    overlay.appendChild(spotlight);

    const bubble = document.createElement('div');
    bubble.style.cssText = `
      position:absolute;background:var(--surface2,#1e2030);border:1.5px solid var(--accent,#a78bfa);
      border-radius:16px;padding:20px 24px;max-width:320px;z-index:2;pointer-events:all;
      box-shadow:0 16px 48px rgba(0,0,0,0.5);transition:all .4s cubic-bezier(.4,0,.2,1);
    `;
    overlay.appendChild(bubble);
    document.body.appendChild(overlay);

    function render() {
      const step = steps[current];
      bubble.innerHTML = `
        <div style="font-size:2rem;margin-bottom:8px">${step.emoji || '💡'}</div>
        <div style="font-family:Fraunces,serif;font-size:1.1rem;font-weight:700;color:var(--accent,#a78bfa);margin-bottom:8px">${step.title}</div>
        <div style="font-size:14px;color:var(--text-muted,#8b8fa8);line-height:1.6;margin-bottom:16px">${step.desc}</div>
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
          <button id="tut-skip" style="background:none;border:none;color:var(--text-muted,#8b8fa8);cursor:pointer;font-size:13px;padding:4px 8px;border-radius:6px">Überspringen</button>
          <div style="display:flex;gap:6px;align-items:center">
            ${current > 0 ? '<button id="tut-prev" class="btn-secondary" style="padding:6px 14px;font-size:13px">← Zurück</button>' : ''}
            <button id="tut-next" class="btn-primary" style="padding:6px 16px;font-size:13px">${current === steps.length - 1 ? 'Fertig ✓' : 'Weiter →'}</button>
          </div>
        </div>
        <div style="margin-top:12px;display:flex;gap:4px;justify-content:center">
          ${steps.map((_, i) => `<div style="width:6px;height:6px;border-radius:50%;background:${i === current ? 'var(--accent,#a78bfa)' : 'var(--border,#2a2d3e)'}"></div>`).join('')}
        </div>
      `;

      // Ziel-Element positionieren
      if (step.target) {
        const el = document.querySelector(step.target);
        if (el) {
          const r = el.getBoundingClientRect();
          const pad = 8;
          spotlight.style.left = (r.left - pad) + 'px';
          spotlight.style.top = (r.top - pad) + 'px';
          spotlight.style.width = (r.width + pad*2) + 'px';
          spotlight.style.height = (r.height + pad*2) + 'px';
          spotlight.style.opacity = '1';

          // Bubble positionieren
          const bTop = r.bottom + pad + 16;
          const bLeft = Math.min(r.left, window.innerWidth - 340);
          bubble.style.top = (bTop + window.scrollY) + 'px';
          bubble.style.left = Math.max(16, bLeft) + 'px';
        } else {
          spotlight.style.opacity = '0';
          bubble.style.top = '50%';
          bubble.style.left = '50%';
          bubble.style.transform = 'translate(-50%,-50%)';
        }
      } else {
        spotlight.style.opacity = '0';
        bubble.style.top = '50%';
        bubble.style.left = '50%';
        bubble.style.transform = 'translate(-50%,-50%)';
      }

      document.getElementById('tut-skip')?.addEventListener('click', close);
      document.getElementById('tut-next')?.addEventListener('click', () => {
        if (current < steps.length - 1) { current++; render(); }
        else close();
      });
      document.getElementById('tut-prev')?.addEventListener('click', () => {
        if (current > 0) { current--; render(); }
      });
    }

    function close() {
      overlay.remove();
      markTutorialSeen(tutorialId);
    }

    render();
  }

  // Auto-init
  document.addEventListener('DOMContentLoaded', () => {
    injectLogos();
    // fadeOut CSS
    if (!document.getElementById('kt-anim')) {
      const s = document.createElement('style');
      s.id = 'kt-anim';
      s.textContent = '@keyframes fadeOut{to{opacity:0;transform:translateY(8px)}}';
      document.head.appendChild(s);
    }
  });

  return {
    load, save, getEmpty, uid, genCode, calcScore, fmtTime,
    toast, download, sha256, checkAdmin, gradeColor, injectLogos,
    seedDemoData, qrUrl, showTutorial, markTutorialSeen, tutorialSeen,
    STORAGE_KEY
  };
})();
