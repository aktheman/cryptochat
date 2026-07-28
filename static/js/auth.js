let pendingCodes = [];
let qrPollTimer = null;
let qrToken = null;

function switchTab(tab) {
  if (!tab) return;
  const map = {register: 0, login: 1, recovery: 2, qr: 3};
  const idx = map[tab];
  if (idx === undefined) return;
  document.querySelectorAll('.tab').forEach((el, i) => el.classList.toggle('active', i === idx));
  document.querySelectorAll('.form').forEach(f => f.classList.remove('active'));
  document.getElementById('codes-view').classList.remove('show');
  document.getElementById('feedback').className = 'feedback';
  if (tab === 'register') document.getElementById('form-register').classList.add('active');
  else if (tab === 'login') document.getElementById('form-login').classList.add('active');
  else if (tab === 'recovery') document.getElementById('form-recovery').classList.add('active');
  else if (tab === 'qr') {
    document.getElementById('form-qr').classList.add('active');
    startQRLogin();
  }
}

function showFeedback(text, type) {
  const el = document.getElementById('feedback');
  el.textContent = text;
  el.className = 'feedback show ' + type;
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideFeedback() {
  document.getElementById('feedback').className = 'feedback';
}

function showCodes(codes) {
  pendingCodes = codes;
  const list = document.getElementById('codes-list');
  list.innerHTML = '';
  codes.forEach(c => {
    list.innerHTML += '<div class="code-item"><span class="code-dot"></span>' + c.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') + '</div>';
  });
  document.querySelectorAll('.form').forEach(f => f.classList.remove('active'));
  document.getElementById('codes-view').classList.add('show');
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  hideFeedback();
}

async function copyCodes() {
  const btn = document.getElementById('copy-btn');
  const icon = document.getElementById('copy-icon');
  try { await navigator.clipboard.writeText(pendingCodes.join('\n')); } catch(e) { return; }
  icon.textContent = '✓';
  btn.classList.add('done');
  setTimeout(() => {
    icon.textContent = '📋';
    btn.classList.remove('done');
  }, 2000);
}

async function api(url, data) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      signal: controller.signal
    });
    clearTimeout(timer);
    if (r.status === 0) throw new Error('Nettverksfeil. Sjekk tilkoblingen.');
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.message || j.error || 'Noe gikk galt (HTTP ' + r.status + ')');
    return j;
  } catch (e) {
    clearTimeout(timer);
    if (e.name === 'AbortError') throw new Error('Tidsavbrudd. Serveren svarer ikke.');
    throw e;
  }
}

async function startQRLogin() {
  stopQRPolling();
  const placeholder = document.getElementById('qrPlaceholder');
  const qrImage = document.getElementById('qrImage');
  const qrStatus = document.getElementById('qrStatus');
  if (!placeholder || !qrImage || !qrStatus) return;
  placeholder.style.display = 'block';
  qrImage.style.display = 'none';
  qrStatus.textContent = 'Genererer kode...';
  try {
    const r = await fetch('/auth/qr/generate', { method: 'POST' });
    const d = await r.json();
    if (!d.success) { qrStatus.textContent = 'Kunne ikke generere QR-kode.'; return; }
    qrToken = d.token;
    if (d.qr) {
      qrImage.src = 'data:image/png;base64,' + d.qr;
      qrImage.style.display = 'block';
      placeholder.style.display = 'none';
    }
    qrStatus.textContent = 'Skann QR-koden med en logget inn enhet';
    qrPollTimer = setInterval(() => pollQRStatus(), 2000);
  } catch(e) {
    qrStatus.textContent = 'Feil ved generering av QR-kode.';
  }
}

function stopQRPolling() {
  if (qrPollTimer) {
    clearInterval(qrPollTimer);
    qrPollTimer = null;
  }
}

async function pollQRStatus() {
  if (!qrToken) return;
  try {
    const r = await fetch('/auth/qr/status/' + encodeURIComponent(qrToken));
    const d = await r.json();
    const qrStatus = document.getElementById('qrStatus');
    if (!qrStatus) return;
    if (d.status === 'accepted') {
      stopQRPolling();
      qrStatus.textContent = 'Godkjent! Logger inn...';
      const loginR = await fetch('/auth/qr/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: qrToken })
      });
      const loginD = await loginR.json();
      if (loginD.success) {
        qrStatus.textContent = 'Innlogging vellykket!';
        setTimeout(() => { location.href = '/chat'; }, 500);
      } else {
        qrStatus.textContent = 'Kunne ikke logge inn: ' + (loginD.message || 'Feil');
      }
    } else if (d.status === 'expired' || (d.status === 'pending' && d.expired)) {
      stopQRPolling();
      qrStatus.textContent = 'Koden er utløpt. Klikk for å prøve på nytt.';
    }
  } catch(e) {
    // silent
  }
}

document.getElementById('form-register').onsubmit = async (e) => {
  e.preventDefault();
  try {
    showFeedback('Oppretter konto...', 'loading');
    const d = await api('/auth/register', {
      username: document.getElementById('reg-user').value.trim(),
      password: document.getElementById('reg-pass').value
    });
    if (d.recovery_codes && d.recovery_codes.length) {
      showCodes(d.recovery_codes);
    } else {
      showFeedback('Konto opprettet!', 'success');
      setTimeout(() => { location.href = '/chat'; }, 400);
    }
  } catch (err) { showFeedback(err.message, 'error'); }
};

document.getElementById('form-login').onsubmit = async (e) => {
  e.preventDefault();
  try {
    showFeedback('Logger inn...', 'loading');
    await api('/auth/login', {
      username: document.getElementById('login-user').value.trim(),
      password: document.getElementById('login-pass').value
    });
    location.href = '/chat';
  } catch (err) { showFeedback(err.message, 'error'); }
};

document.getElementById('form-recovery').onsubmit = async (e) => {
  e.preventDefault();
  try {
    showFeedback('Tilbakestiller passord...', 'loading');
    const d = await api('/auth/recovery', {
      username: document.getElementById('rec-user').value.trim(),
      code: document.getElementById('rec-code').value.trim(),
      new_password: document.getElementById('rec-pass').value
    });
    showFeedback(d.message || 'Passord tilbakestilt!', 'success');
    setTimeout(() => switchTab('login'), 1500);
  } catch (err) { showFeedback(err.message, 'error'); }
};

document.addEventListener('click', (e) => {
  const tabBtn = e.target.closest('[data-tab]');
  if (tabBtn) switchTab(tabBtn.getAttribute('data-tab'));
  if (e.target.id === 'copy-btn') copyCodes();
});

document.getElementById('form-qr')?.addEventListener('click', () => {
  if (!qrPollTimer && qrToken) startQRLogin();
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(r => r.forEach(x => x.unregister()));
  caches.keys().then(k => k.forEach(x => caches.delete(x)));
}

function toggleTheme() {
  const isLight = document.body.classList.toggle('light');
  localStorage.setItem('theme', isLight ? 'light' : 'dark');
}

const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'light') document.body.classList.add('light');

const themeBtn = document.getElementById('themeToggle');
if (themeBtn) themeBtn.addEventListener('click', toggleTheme);
