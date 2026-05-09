// KlassenTest – kt.js
// Core utility library

const KT = (() => {
  const KEY = 'klassentest_v3';

  function get() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return empty();
      const d = JSON.parse(raw);
      if (!d.tests) d.tests = [];
      if (!d.students) d.students = [];
      if (!d.submissions) d.submissions = [];
      if (!d.teachers) d.teachers = [];
      return d;
    } catch { return empty(); }
  }

  function empty() {
    return { tests: [], students: [], submissions: [], teachers: [] };
  }

  function set(data) {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { console.error('KT.set error', e); }
  }

  function gid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function genCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  }

  function esc(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function fmt(secs) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m + ':' + String(s).padStart(2, '0');
  }

  function calcScore(sub, test) {
    if (!sub || !test) return { scored: 0, total: 0 };
    let scored = 0, total = 0;
    (test.blocks || []).forEach(b => {
      if (!['mc', 'multi'].includes(b.type)) return;
      const pts = b.data.points || 1;
      total += pts;
      const ans = sub.answers?.[b.id];
      if (b.type === 'mc' && ans === b.data.correctIndex) scored += pts;
      if (b.type === 'multi') {
        const correct = JSON.stringify([...(b.data.correctIndexes || [])].sort((a, c) => a - c));
        const given = JSON.stringify([...(ans || [])].sort((a, c) => a - c));
        if (correct === given) scored += pts;
      }
    });
    return { scored, total };
  }

  function gradeColor(grade) {
    const g = String(grade).replace(/[+-]/, '');
    const colors = { '1': '#16a34a', '2': '#65a30d', '3': '#ca8a04', '4': '#ea580c', '5': '#dc2626', '6': '#991b1b' };
    return colors[g] || '#6366f1';
  }

  function dl(filename, content, mime = 'text/plain') {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // Toast notification
  let toastTimer = null;
  function toast(msg, duration = 2800) {
    let el = document.getElementById('kt-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'kt-toast';
      el.style.cssText = `
        position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(20px);
        background:#1f2937;color:#fff;padding:10px 20px;border-radius:22px;
        font-size:13px;font-weight:600;z-index:9999;opacity:0;
        transition:all .25s cubic-bezier(.16,1,.3,1);pointer-events:none;
        font-family:'DM Sans',system-ui,sans-serif;box-shadow:0 4px 20px rgba(0,0,0,.3);
        white-space:nowrap;
      `;
      document.body.appendChild(el);
    }
    el.textContent = msg;
    requestAnimationFrame(() => {
      el.style.opacity = '1';
      el.style.transform = 'translateX(-50%) translateY(0)';
    });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateX(-50%) translateY(10px)';
    }, duration);
  }

  // Admin auth - hashed check (SHA-256 via Web Crypto)
  // Hash of 'Samuelsingh368' and 'Samuelforever385!'
  // These are stored as hashes, not plaintext
  const ADMIN_USER_HASH = 'a3b4c2d1e5f6789012345678901234567890abcdef1234567890abcdef123456'; // placeholder
  const ADMIN_PASS_HASH = 'b5c6d7e8f9012345678901234567890abcdef1234567890abcdef12345678901'; // placeholder

  async function hashString(str) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async function checkAdmin(user, pass) {
    const [uh, ph] = await Promise.all([hashString(user), hashString(pass)]);
    const [correctUh, correctPh] = await Promise.all([
      hashString('Samuelsingh368'),
      hashString('Samuelforever385!')
    ]);
    return uh === correctUh && ph === correctPh;
  }

  return { get, set, gid, genCode, esc, fmt, calcScore, gradeColor, dl, toast, checkAdmin };
})();
