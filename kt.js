// kt.js – Fusion v5 Shared Library
// Made by Samuel Singh and Giox
'use strict';

const KT = (() => {
  const STORAGE_KEY = 'fusion_v5';
  const SESSION_TEACHER = 'fusion_teacher_session';
  const SESSION_ADMIN   = 'fusion_admin_session';
  const SESSION_STUDENT = 'fusion_student_session';
  const TUTORIAL_KEY    = 'fusion_v5_tutorials';

  // ─── Storage ────────────────────────────────────────────────────────────────
  function load() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || getEmpty(); }
    catch { return getEmpty(); }
  }
  function save(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
  function getEmpty() {
    return {
      tests: [],
      students: [],
      submissions: [],
      teachers: [],
      templates: [],
      modelAnswers: {},
      settings: {}
    };
  }

  // ─── IDs & Codes ────────────────────────────────────────────────────────────
  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }
  function genCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // ─── Crypto ─────────────────────────────────────────────────────────────────
  async function sha256(str) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
  }

  // ─── Admin credentials (obfuscated) ─────────────────────────────────────────
  const _vd = (function(){
    const _a=[72,101,114,114,32,83,97,109,117,101,108,32,83,105,110,103,104];
    const _b=[76,252,100,101,110,115,99,104,101,105,100];
    const _c=[83,97,109,117,101,108,70,111,114,101,118,101,114,51,53,56,33];
    return {
      _n:()=>String.fromCharCode(..._a).toLowerCase(),
      _c:()=>String.fromCharCode(..._b).toLowerCase(),
      _p:()=>String.fromCharCode(..._c)
    };
  })();

  async function checkAdmin(n, c, p) {
    const [a,b,d] = await Promise.all([sha256(n.trim().toLowerCase()),sha256(c.trim().toLowerCase()),sha256(p.trim())]);
    const [x,y,z] = await Promise.all([sha256(_vd._n()),sha256(_vd._c()),sha256(_vd._p())]);
    return a===x && b===y && d===z;
  }

  // ─── Session helpers ─────────────────────────────────────────────────────────
  function setAdminSession()   { sessionStorage.setItem(SESSION_ADMIN, '1'); }
  function clearAdminSession() { sessionStorage.removeItem(SESSION_ADMIN); }
  function isAdminSession()    { return sessionStorage.getItem(SESSION_ADMIN) === '1'; }

  function setTeacherSession(tid)  { sessionStorage.setItem(SESSION_TEACHER, tid); }
  function clearTeacherSession()   { sessionStorage.removeItem(SESSION_TEACHER); }
  function getTeacherSession()     { return sessionStorage.getItem(SESSION_TEACHER); }

  function setStudentSession(obj)  { sessionStorage.setItem(SESSION_STUDENT, JSON.stringify(obj)); }
  function clearStudentSession()   { sessionStorage.removeItem(SESSION_STUDENT); }
  function getStudentSession()     {
    try { return JSON.parse(sessionStorage.getItem(SESSION_STUDENT)); }
    catch { return null; }
  }

  // ─── Score ──────────────────────────────────────────────────────────────────
  function calcScore(test, answers) {
    let earned = 0, total = 0;
    if (!test || !test.pages) return { earned:0, total:0, pct:0 };
    test.pages.forEach(page => {
      (page.elements||[]).forEach(el => {
        if (el.type === 'mc') {
          const pts = el.points||1; total += pts;
          if (answers[el.id] !== undefined && answers[el.id] === el.correct) earned += pts;
        } else if (el.type === 'multi') {
          const pts = el.points||1; total += pts;
          const correct = (el.correct||[]).slice().sort().join(',');
          const given   = (answers[el.id]||[]).slice().sort().join(',');
          if (correct === given) earned += pts;
        }
      });
    });
    return { earned, total, pct: total>0 ? Math.round((earned/total)*100) : 0 };
  }

  // ─── Model-answer based scoring ──────────────────────────────────────────────
  function scoreWithModelAnswers(test, answers, modelAnswers) {
    let earned = 0, total = 0;
    if (!test || !test.pages) return { earned:0, total:0, pct:0 };
    test.pages.forEach(page => {
      (page.elements||[]).forEach(el => {
        const ma = modelAnswers && modelAnswers[el.id];
        if (el.type === 'mc') {
          const pts = el.points||1; total += pts;
          const correct = ma !== undefined ? ma : el.correct;
          if (answers[el.id] !== undefined && answers[el.id] === correct) earned += pts;
        } else if (el.type === 'multi') {
          const pts = el.points||1; total += pts;
          const correctArr = ma !== undefined ? ma : (el.correct||[]);
          const correct = correctArr.slice().sort().join(',');
          const given = (answers[el.id]||[]).slice().sort().join(',');
          if (correct === given) earned += pts;
        }
      });
    });
    return { earned, total, pct: total>0 ? Math.round((earned/total)*100) : 0 };
  }

  // ─── Time ────────────────────────────────────────────────────────────────────
  function fmtTime(sec) {
    if (sec < 0) sec = 0;
    const m = Math.floor(sec/60).toString().padStart(2,'0');
    const s = (sec%60).toString().padStart(2,'0');
    return `${m}:${s}`;
  }

  // ─── Grade helpers ────────────────────────────────────────────────────────────
  function gradeColor(grade) {
    if (!grade) return 'var(--text-muted)';
    const g = grade.toString().replace(/[+\-]/g,'');
    const map = {'1':'#4ade80','2':'#86efac','3':'#fbbf24','4':'#fb923c','5':'#f87171','6':'#ef4444'};
    return map[g]||'var(--accent)';
  }

  function gradeFromPct(pct) {
    if (pct >= 92) return '1+';
    if (pct >= 85) return '1';
    if (pct >= 80) return '1-';
    if (pct >= 75) return '2+';
    if (pct >= 70) return '2';
    if (pct >= 65) return '2-';
    if (pct >= 60) return '3+';
    if (pct >= 55) return '3';
    if (pct >= 50) return '3-';
    if (pct >= 45) return '4+';
    if (pct >= 40) return '4';
    if (pct >= 35) return '4-';
    if (pct >= 25) return '5';
    if (pct >= 15) return '5-';
    return '6';
  }

  // ─── Toast ───────────────────────────────────────────────────────────────────
  function toast(msg, type='info', duration=3500) {
    let wrap = document.getElementById('kt-toast-wrap');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'kt-toast-wrap';
      wrap.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:99999;display:flex;flex-direction:column;gap:8px;pointer-events:none';
      document.body.appendChild(wrap);
    }
    const icons  = {info:'ℹ️',success:'✅',error:'❌',warn:'⚠️'};
    const colors = {info:'var(--accent2)',success:'var(--green)',error:'var(--red)',warn:'var(--yellow)'};
    const t = document.createElement('div');
    t.style.cssText = `
      background:var(--surface2);border:1.5px solid ${colors[type]||'var(--border)'};
      color:var(--text);padding:12px 18px;border-radius:12px;
      display:flex;align-items:center;gap:10px;font-size:14px;
      box-shadow:0 8px 32px rgba(0,0,0,.5);pointer-events:auto;
      animation:ktFadeIn .3s ease;max-width:340px;word-break:break-word;
    `;
    t.innerHTML = `<span>${icons[type]||'ℹ️'}</span><span>${msg}</span>`;
    wrap.appendChild(t);
    setTimeout(()=>{ t.style.animation='ktFadeOut .3s ease forwards'; setTimeout(()=>t.remove(),300); }, duration);
  }

  // ─── Tutorial ────────────────────────────────────────────────────────────────
  // steps = [{ emoji, title, desc, target? }]
  // key   = unique string to remember "already shown"
  function showTutorial(steps, key) {
    if (!steps || steps.length === 0) return;
    try {
      const seen = JSON.parse(localStorage.getItem(TUTORIAL_KEY) || '{}');
      if (seen[key]) return;
    } catch {}

    let stepIdx = 0;
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position:fixed;inset:0;z-index:8000;
      background:rgba(0,0,0,.55);backdrop-filter:blur(6px);
      display:flex;align-items:center;justify-content:center;padding:24px;
      animation:ktFadeIn .25s ease;
    `;

    function render() {
      const s = steps[stepIdx];
      overlay.innerHTML = `
        <div style="
          background:var(--surface);border:1px solid var(--border2);
          border-radius:24px;padding:36px 32px 28px;max-width:420px;width:100%;
          box-shadow:0 32px 80px rgba(0,0,0,.6);
          animation:ktScaleIn .3s cubic-bezier(.34,1.56,.64,1);
          text-align:center;
        ">
          <div style="font-size:3rem;margin-bottom:16px">${s.emoji||'👋'}</div>
          <div style="font-family:'Fraunces',Georgia,serif;font-size:1.3rem;font-weight:700;margin-bottom:10px;color:var(--text)">${s.title||''}</div>
          <p style="font-size:14px;color:var(--text-muted);line-height:1.7;margin-bottom:28px">${s.desc||''}</p>
          <div style="display:flex;align-items:center;justify-content:space-between;gap:12px">
            <div style="display:flex;gap:6px">
              ${steps.map((_,i)=>`<div style="width:8px;height:8px;border-radius:50%;background:${i===stepIdx?'var(--accent)':'var(--border2)'}"></div>`).join('')}
            </div>
            <div style="display:flex;gap:10px">
              ${stepIdx > 0 ? `<button id="tut-back" style="background:var(--surface2);border:1px solid var(--border);color:var(--text-muted);padding:8px 16px;border-radius:10px;cursor:pointer;font-size:13px">← Zurück</button>` : ''}
              <button id="tut-next" style="background:var(--accent);color:var(--bg);border:none;padding:9px 20px;border-radius:10px;cursor:pointer;font-size:14px;font-weight:600">
                ${stepIdx < steps.length - 1 ? 'Weiter →' : 'Los geht\'s ✓'}
              </button>
            </div>
          </div>
          <button id="tut-skip" style="background:none;border:none;color:var(--text-dim);font-size:12px;cursor:pointer;margin-top:16px;display:block;width:100%">Überspringen</button>
        </div>`;

      overlay.querySelector('#tut-next').onclick = () => {
        if (stepIdx < steps.length - 1) { stepIdx++; render(); }
        else closeTut();
      };
      const back = overlay.querySelector('#tut-back');
      if (back) back.onclick = () => { stepIdx--; render(); };
      overlay.querySelector('#tut-skip').onclick = closeTut;
    }

    function closeTut() {
      overlay.remove();
      try {
        const seen = JSON.parse(localStorage.getItem(TUTORIAL_KEY) || '{}');
        seen[key] = true;
        localStorage.setItem(TUTORIAL_KEY, JSON.stringify(seen));
      } catch {}
    }

    render();
    document.body.appendChild(overlay);
  }

  // ─── Download ────────────────────────────────────────────────────────────────
  function download(filename, content, mime='text/plain') {
    const blob = new Blob([content],{type:mime});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename; a.click();
    URL.revokeObjectURL(a.href);
  }

  // ─── QR code ─────────────────────────────────────────────────────────────────
  function qrUrl(text, size=200) {
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`;
  }

  // ─── Logo injector ───────────────────────────────────────────────────────────
  function injectLogos() {
    document.querySelectorAll('.logo-mark').forEach(el => {
      if (el.querySelector('svg')) return;
      const gid = 'lg_' + Math.random().toString(36).slice(2,6);
      el.insertAdjacentHTML('afterbegin', `
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#3b82f6"/>
              <stop offset="55%" stop-color="#6366f1"/>
              <stop offset="100%" stop-color="#8b5cf6"/>
            </linearGradient>
          </defs>
          <rect x="1" y="1" width="34" height="34" rx="9" fill="url(#${gid})"/>
          <rect x="4" y="4" width="21" height="27" rx="5" fill="white" opacity=".95"/>
          <circle cx="10" cy="13" r="3" fill="#3b82f6"/>
          <path d="M8.8 13l1.2 1.3 2.2-2.2" stroke="white" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
          <rect x="15" y="12" width="7" height="1.8" rx="0.9" fill="#c7d2fe"/>
          <circle cx="10" cy="20" r="3" fill="#6366f1"/>
          <path d="M8.8 20l1.2 1.3 2.2-2.2" stroke="white" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
          <rect x="15" y="19" width="5" height="1.8" rx="0.9" fill="#c7d2fe"/>
          <circle cx="10" cy="27" r="3" fill="#e2e8f0" opacity=".45"/>
          <rect x="15" y="26" width="3.5" height="1.8" rx="0.9" fill="#e2e8f0"/>
          <path d="M20 25 L25 33 L35 17" stroke="url(#${gid})" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        </svg>
        <span class="logo-wordmark">Fusion</span>
      `);
    });
  }

  // ─── Demo seed ───────────────────────────────────────────────────────────────
  function seedDemoData() {
    const data = load();
    if (data.tests.length > 0) return;
    const testId = uid(), now = Date.now();
    const demoTest = {
      id: testId, title: 'Demo-Test: Grundlagen Mathematik',
      subject: 'Mathematik', grade: '8a', status: 'ended',
      createdAt: now-86400000, startedAt: now-3600000, endedAt: now-1800000,
      duration: 45, code: '123456', teacherId: 'demo-teacher',
      background: 'lined',
      pages:[{id:uid(),label:'Seite 1',elements:[
        {id:'el1',type:'heading',level:'h1',text:'Mathetest – Klasse 8a'},
        {id:'el2',type:'text',text:'Beantworte alle Fragen sorgfältig.'},
        {id:'el3',type:'mc',question:'Was ist 7 × 8?',options:['52','54','56','58'],correct:2,points:2},
        {id:'el4',type:'mc',question:'Welche Zahl ist eine Primzahl?',options:['9','15','17','21'],correct:2,points:2},
        {id:'el5',type:'multi',question:'Welche Zahlen sind durch 3 teilbar?',options:['9','12','14','21','25'],correct:[0,1,3],points:3},
        {id:'el6',type:'free',question:'Erkläre in eigenen Worten, was ein Bruch ist.',rows:4},
        {id:'el7',type:'mc',question:'Was ergibt √144?',options:['10','11','12','13'],correct:2,points:2},
      ]}]
    };
    const students = [
      {id:uid(),name:'Anna Müller',testId,joinedAt:now-3500000},
      {id:uid(),name:'Ben Schmidt',testId,joinedAt:now-3400000},
      {id:uid(),name:'Clara Weber',testId,joinedAt:now-3300000},
    ];
    const submissions = [
      {id:uid(),testId,studentName:'Anna Müller',submittedAt:now-2000000,
       answers:{el3:2,el4:2,el5:[0,1,3],el6:'Ein Bruch beschreibt einen Teil eines Ganzen.',el7:2},
       score:{earned:9,total:9,pct:100},grade:'1',feedback:'Sehr gut!',corrected:true,sentAt:now-1800000},
      {id:uid(),testId,studentName:'Ben Schmidt',submittedAt:now-1900000,
       answers:{el3:0,el4:2,el5:[0,1],el6:'Ein Bruch ist eine Division.',el7:2},
       score:{earned:6,total:9,pct:67},grade:'3',feedback:'Gute Leistung.',corrected:true,sentAt:now-1700000},
      {id:uid(),testId,studentName:'Clara Weber',submittedAt:now-1800000,
       answers:{el3:1,el4:1,el5:[0,1,2,3],el6:'',el7:1},
       score:{earned:2,total:9,pct:22},grade:'5',feedback:'Bitte wiederholen.',corrected:true,sentAt:now-1600000},
    ];
    data.tests.push(demoTest);
    students.forEach(s=>data.students.push(s));
    submissions.forEach(s=>data.submissions.push(s));
    save(data);
  }

  // Auto-init
  document.addEventListener('DOMContentLoaded', () => {
    injectLogos();
    if (!document.getElementById('kt-style')) {
      const s = document.createElement('style');
      s.id = 'kt-style';
      s.textContent = `
        @keyframes ktFadeIn  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        @keyframes ktFadeOut { to{opacity:0;transform:translateY(8px)} }
        @keyframes ktScaleIn { from{opacity:0;transform:scale(.92)} to{opacity:1;transform:none} }
        .logo-mark { display:inline-flex; align-items:center; gap:10px; }
        .logo-wordmark {
          font-family:'Fraunces',Georgia,serif;
          font-size:1.35rem; font-weight:900;
          background:linear-gradient(135deg,#3b82f6,#6366f1,#8b5cf6);
          -webkit-background-clip:text; -webkit-text-fill-color:transparent;
          background-clip:text;
        }
      `;
      document.head.appendChild(s);
    }
  });

  return {
    load, save, getEmpty, uid, genCode,
    sha256, checkAdmin,
    setAdminSession, clearAdminSession, isAdminSession,
    setTeacherSession, clearTeacherSession, getTeacherSession,
    setStudentSession, clearStudentSession, getStudentSession,
    calcScore, scoreWithModelAnswers, fmtTime, gradeColor, gradeFromPct,
    toast, showTutorial, download, qrUrl, injectLogos, seedDemoData,
    STORAGE_KEY
  };
})();
