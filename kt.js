// Fusion – kt.js v4
const KT = (() => {
  const KEY = 'fusion_v4';

  function get() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return empty();
      const d = JSON.parse(raw);
      if (!d.tests) d.tests = [];
      if (!d.students) d.students = [];
      if (!d.submissions) d.submissions = [];
      if (!d.teachers) d.teachers = [];
      if (!d.templates) d.templates = {};
      return d;
    } catch { return empty(); }
  }

  function empty() {
    return { tests: [], students: [], submissions: [], teachers: [], templates: {} };
  }

  function set(data) {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { console.error('KT.set', e); }
  }

  function gid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function genCode() {
    const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let s = '';
    for (let i = 0; i < 6; i++) s += c[Math.floor(Math.random() * c.length)];
    return s;
  }

  function esc(str) {
    if (str == null) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  function fmt(secs) {
    if (secs < 0) secs = 0;
    return Math.floor(secs/60) + ':' + String(secs%60).padStart(2,'0');
  }

  function calcScore(sub, test) {
    if (!sub || !test) return { scored: 0, total: 0 };
    let scored = 0, total = 0;
    const pages = test.pages || [];
    pages.forEach(pg => {
      (pg.blocks || []).forEach(b => {
        if (!['mc','multi'].includes(b.type)) return;
        const pts = b.points || 1;
        total += pts;
        const ans = sub.answers?.[b.id];
        if (b.type === 'mc' && ans === b.correctIndex) scored += pts;
        if (b.type === 'multi') {
          const ok = JSON.stringify([...(b.correctIndexes||[])].sort((a,c)=>a-c));
          const gv = JSON.stringify([...(ans||[])].sort((a,c)=>a-c));
          if (ok === gv) scored += pts;
        }
      });
    });
    return { scored, total };
  }

  function gradeColor(g) {
    const n = String(g).replace(/[+-]/,'');
    return {'1':'#16a34a','2':'#65a30d','3':'#ca8a04','4':'#ea580c','5':'#dc2626','6':'#991b1b'}[n]||'#6366f1';
  }

  function dl(filename, content, mime='text/plain') {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([content],{type:mime}));
    a.download = filename; a.click();
  }

  let _tt = null;
  function toast(msg, dur=2800) {
    let el = document.getElementById('kt-toast');
    if (!el) {
      el = document.createElement('div'); el.id='kt-toast';
      el.style.cssText='position:fixed;bottom:28px;left:50%;transform:translateX(-50%) translateY(20px);background:#0f1117;color:#f0f0f5;padding:11px 22px;border-radius:24px;font-size:13px;font-weight:700;z-index:9999;opacity:0;transition:all .25s cubic-bezier(.16,1,.3,1);pointer-events:none;border:1px solid rgba(255,255,255,.15);font-family:inherit;box-shadow:0 8px 32px rgba(0,0,0,.5);white-space:nowrap;';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    requestAnimationFrame(()=>{ el.style.opacity='1'; el.style.transform='translateX(-50%) translateY(0)'; });
    clearTimeout(_tt);
    _tt = setTimeout(()=>{ el.style.opacity='0'; el.style.transform='translateX(-50%) translateY(10px)'; }, dur);
  }

  async function sha256(str) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
  }

  async function checkAdmin(name, city, pass) {
    const [nh,ch,ph] = await Promise.all([sha256(name.trim().toLowerCase()), sha256(city.trim().toLowerCase()), sha256(pass.trim())]);
    const [ah,ac,ap] = await Promise.all([sha256('herr samuel singh'), sha256('lüdenscheid'), sha256('SamuelForever358!')]);
    return nh===ah && ch===ac && ph===ap;
  }

  const SUBJECTS = ['Mathe','Deutsch','Englisch','Geschichte','Erdkunde','Informatik','Politik','Physik','Biologie','Chemie'];
  const CLASSES  = ['5a','5b','5c','6a','6b','6c','7a','7b','7c','8a','8b','8c','9a','9b','9c','10a','10b','10c','EF','Q1','Q2'];
  const TITLES   = ['Herr','Frau','Dr.','Prof.'];

  return { get, set, gid, genCode, esc, fmt, calcScore, gradeColor, dl, toast, sha256, checkAdmin, SUBJECTS, CLASSES, TITLES };
})();
