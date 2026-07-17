const API_BASE = '';
const appState = {
  currentUser: window.__APP__?.username || '',
  currentChat: null, // { type:'user'|'group', id:'username'|'groupId' }
  pollTimer: null,
  partnerKeys: window.__APP__?.partnerKey || {}
};

function el(id) { return document.getElementById(id); }
function qsa(sel) { return document.querySelectorAll(sel); }

function toast(message, kind = 'info') {
  const container = el('toastContainer');
  if (!container) return;
  const t = document.createElement('div');
  t.className = 'toast ' + kind;
  t.textContent = message;
  container.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

function setFeedback(id, message, type = 'success') {
  const box = el(id);
  if (!box) return;
  box.textContent = message;
  box.className = 'feedback ' + type + ' loading';
}

function serializeForm(form) {
  const fd = new FormData(form);
  const obj = {};
  fd.forEach((value, key) => obj[key] = value);
  return obj;
}

async function api(path, options = {}) {
  const defaults = { headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin' };
  const merged = { ...defaults, ...options };
  const res = await fetch(API_BASE + path, merged);
  if (res.status === 401 && ['/login','/register'].includes(API_BASE + path) === false) {
    logout();
    throw new Error('Ikke innlogget.');
  }
  const text = await res.text();
  if (!text) return undefined;
  try { return JSON.parse(text); }
  catch { return text; }
}

async function login() {
  const form = el('loginForm');
  if (!form) return;
  const data = serializeForm(form);
  try {
    setFeedback('authMessage', 'Logger inn...', 'info');
    const r = await api('/login', { method: 'POST', body: JSON.stringify(data) });
    if (r?.success) {
      setFeedback('authMessage', 'Vellykket innlogging.', 'success');
      setTimeout(() => (location.href = '/chat'), 300);
    } else {
      const msg = r?.message || 'Innlogging feilet.';
      setFeedback('authMessage', msg, 'error');
    }
  } catch (e) {
    setFeedback('authMessage', 'Nettverksfeil: ' + e.message, 'error');
  }
}

async function logout() {
  await api('/logout', { method: 'POST' });
  appState.currentUser = '';
  location.href = '/login';
}

function switchTab(tab) {
  qsa('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.target === tab));
  qsa('.tab-panel').forEach(p => p.style.display = p.id === tab + '-tab' ? 'block' : 'none');
}

async function register() {
  const name = el('regName').value.trim();
  const pass = el('regPass').value;
  const pass2 = el('regPass2').value;
  const feedback = el('authMessage');
  if (!name || !pass) { setFeedback('authMessage', 'Fyll ut alle felter.', 'error'); return; }
  if (name.length < 3) { setFeedback('authMessage', 'Brukernavn for kort.', 'error'); return; }
  if (pass.length < 6) { setFeedback('authMessage', 'Passord for kort.', 'error'); return; }
  if (pass !== pass2) { setFeedback('authMessage', 'Passordene er ulike.', 'error'); return; }
  setFeedback('authMessage', 'Oppretter konto...', 'info');
  const r = await api('/register', { method: 'POST', body: JSON.stringify({ username: name, password: pass }) });
  if (!r?.success) { setFeedback('authMessage', r?.message || 'Registrering feilet.', 'error'); return; }
  el('registerForm').style.display = 'none';
  el('setTwoFaRegister').style.display = 'block';
  setup2FA(name);
}

async function setup2FA(username) {
  setFeedback('authMessage', '2FA-oppsett starter...', 'info');
  const r = await api('/2fa/enable', { method: 'POST' });
  if (!r?.success) { toast(r?.message || 'Kunne ikke aktivere 2FA.', 'error'); return; }
  if (r.uri) {
    el('qrContainer').innerHTML = '';
    new QRCode(el('qrContainer'), { text: r.uri, width: 180, height: 180 });
  }
}

async function confirm2FARegister() {
  const code = el('regTwoFaConfirm').value.trim();
  if (!code) { toast('Skriv inn kode.', 'error'); return; }
  const r = await api('/2fa/enable', { method: 'POST', body: JSON.stringify({ code }) });
  if (r?.success) { toast('2FA aktivert.', 'success'); location.href = '/chat'; }
  else toast(r?.message || 'Ugyldig kode.', 'error');
}

async function skip2FA() { location.href = '/chat'; }

async function fetchJSON(path, options = {}) { return api(path, options); }

function formatPresence(presence) {
  if (!presence) return '🟡 Ukjent';
  const d = new Date(presence);
  if (isNaN(d)) return '🟡 Ukjent';
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return '🟢 Pålogget';
  if (diff < 600) return '🟡 Fraværende';
  return '⚫ Offline';
}

function renderDirect(list, container, onSelect) {
  container.innerHTML = '';
  if (!list.length) { container.innerHTML = '<div class="item">Ingen brukere</div>'; return; }
  list.forEach(u => {
    const name = u.username || u;
    const div = document.createElement('div');
    div.className = 'item';
    div.dataset.identifier = name;
    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.textContent = name.charAt(0).toUpperCase();
    const info = document.createElement('div');
    info.style.flex = '1';
    const n = document.createElement('div');
    n.className = 'name';
    n.textContent = name;
    const s = document.createElement('div');
    s.className = 'status';
    s.textContent = formatPresence(u.lastSeen);
    info.appendChild(n);
    info.appendChild(s);
    div.appendChild(avatar);
    div.appendChild(info);
    div.addEventListener('click', () => onSelect(name));
    container.appendChild(div);
  });
}

function renderGroups(groups, container, onSelect) {
  container.innerHTML = '';
  if (!groups.length) { container.innerHTML = '<div class="item">Ingen grupper</div>'; return; }
  groups.forEach(g => {
    const div = document.createElement('div');
    div.className = 'item';
    div.dataset.identifier = g.id;
    const n = document.createElement('div');
    n.className = 'name';
    n.textContent = '#' + (g.name || g.id);
    const s = document.createElement('div');
    s.className = 'status';
    s.textContent = (g.members?.length || 0) + ' medlemmer';
    div.appendChild(n);
    div.appendChild(s);
    div.addEventListener('click', () => onSelect(g));
    container.appendChild(div);
  });
}

async function selectDirectUser(user) {
  appState.currentChat = { type: 'user', id: user };
  qsa('.item').forEach(el => el.classList.toggle('active', el.dataset.identifier === user));
  el('chatTitle').textContent = 'Chat med ' + user;
  el('chatMeta').textContent = '';
  el('chatActions').innerHTML = '<button class="btn btn-ghost btn-small" id="btn">🗑 Slett historikk</button><button class="btn btn-small" id="searchToggle">🔍 Søk</button>';
  el('composer').style.display = 'block';
  el('keyBar').style.display = 'none';
  renderComposerActions('user');
  initKeySetup(user);
  await loadMessages();
  bindSearch(user, 'user');
}

async function selectGroup(group) {
  appState.currentChat = { type: 'group', id: group.id };
  qsa('.item').forEach(el => el.classList.toggle('active', el.dataset.identifier === group.id));
  el('chatTitle').textContent = '#' + (group.name || group.id);
  el('chatMeta').textContent = (group.members?.length || 0) + ' medlemmer';
  el('chatActions').innerHTML = '';
  el('composer').style.display = 'block';
  el('keyBar').style.display = 'none';
  renderComposerActions('group');
  await loadGroupMessages(group.id);
  bindSearch(group.id, 'group');
}

function renderComposerActions(chatType) {
  const container = el('composerActions');
  if (!container) return;
  container.innerHTML = '';
  const div = document.createElement('input');
  div.type = 'file'; div.style.display = 'none'; div.id = 'fileInput';
  const share = document.createElement('button');
  share.className = 'btn btn-ghost btn-small'; share.textContent = '📎 Del fil';
  share.addEventListener('click', () => div.click());
  container.appendChild(div);
  container.appendChild(share);
  div.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    const recipient = appState.currentChat?.type === 'group' ? '__group' : appState.currentChat?.id;
    fd.append('file', file);
    fd.append('recipient', recipient || '');
    const r = await api('/upload', { method: 'POST', body: fd });
    if (r?.success) { toast('Fil lastet opp.', 'success'); await loadMessages(); }
    else toast(r?.message || 'Opplasting feilet.', 'error');
    div.value = '';
  });
}

async function initKeySetup(other) {
  if (!other) return;
  el('keyBar').style.display = 'block';
  let my = appState.partnerKeys[other];
  if (!my) {
    const s = await fetchJSON('/key/export?data=' + encodeURIComponent(other));
    my = s?.key || '';
    if (!my) return;
  }
  el('myKey').value = my;
}

function serializePayload(payload) {
  const packed = msgpack.encode(payload);
  return Array.from(new Uint8Array(packed)).map(b => String.fromCharCode(b)).join('');
}
function deserializePayload(str) {
  return msgpack.decode(new Uint8Array(Array.from(str).map(c => c.charCodeAt(0))));
}

async function sendMessage() {
  const text = el('messageText')?.value.trim();
  if (!text || !appState.currentChat) return;
  const key = appState.partnerKeys[appState.currentChat.id];
  if (!key && appState.currentChat.type === 'user') { toast('Del nøkkel først.', 'error'); return; }
  const packed = SimpleCrypto.packEncrypt(text, key);
  const chat = appState.currentChat;
  if (chat.type === 'user') {
    await fetchJSON('/send', {
      method: 'POST',
      body: JSON.stringify({ recipient: chat.id, ciphertext: packed, type: 'text' })
    });
  } else {
    await fetchJSON('/groups/' + chat.id + '/send', {
      method: 'POST',
      body: JSON.stringify({ ciphertext: packed, type: 'text' })
    });
  }
  el('messageText').value = '';
  await loadMessages();
}

async function sendFile() {
  const input = el('fileInput');
  if (!input || !input.files.length) return;
  const file = input.files[0];
  const reader = new FileReader();
  reader.onload = async (e) => {
    const b64 = Array.from(new Uint8Array(e.target.result)).map(b => String.fromCharCode(b)).join('');
    const chat = appState.currentChat;
    if (chat.type === 'user') {
      await fetchJSON('/send', {
        method: 'POST',
        body: JSON.stringify({ recipient: chat.id, ciphertext: b64, type: 'file', filename: file.name })
      });
    } else {
      await fetchJSON('/groups/' + chat.id + '/send', {
        method: 'POST',
        body: JSON.stringify({ ciphertext: b64, type: 'file', filename: file.name })
      });
    }
    toast('Fil sendt.', 'success');
    await loadMessages();
  };
  reader.readAsArrayBuffer(file);
}

async function loadMessages() {
  if (!appState.currentChat || appState.currentChat.type !== 'user') return;
  const other = appState.currentChat.id;
  const data = await fetchJSON('/messages/' + other);
  const area = el('messagesArea');
  if (!data?.success) { area.innerHTML = ''; return; }
  const key = appState.partnerKeys[other];
  const list = (data.messages || []).map(m => ({ ...m, text: (m.type === 'text' ? SimpleCrypto.packDecrypt(m.text, key) : (m.filename || '[fil]')) }));
  renderMessageList(list);
  await fetchJSON('/read_receipts/' + other, { method: 'POST' });
}

async function loadGroupMessages(groupId) {
  const data = await fetchJSON('/groups/' + groupId + '/messages');
  const area = el('messagesArea');
  if (!data?.success) { area.innerHTML = ''; return; }
  const list = (data.messages || []).map(m => ({ ...m, text: (m.type === 'text' ? SimpleCrypto.packDecrypt(m.text) : (m.filename || '[fil]')) }));
  renderMessageList(list);
}

function renderMessageList(list) {
  const area = el('messagesArea');
  const empty = el('emptyState');
  if (!list?.length) {
    area.innerHTML = '';
    if (!area.contains(empty)) area.appendChild(empty);
    return;
  }
  if (empty) empty.style.display = 'none';
  area.innerHTML = '';
  list.forEach(m => {
    const div = document.createElement('div');
    div.className = 'msg ' + (m.sender === appState.currentUser ? 'sent' : 'received');
    const txt = document.createElement('div'); txt.textContent = m.text; txt.className = 'text';
    const meta = document.createElement('div'); meta.className = 'meta';
    const sender = document.createElement('span'); sender.className = 'sender'; sender.textContent = m.sender === appState.currentUser ? 'Deg' : m.sender;
    const time = document.createElement('span'); time.className = 'time'; time.textContent = new Date(m.timestamp).toLocaleTimeString('no-NO', { hour:'2-digit', minute:'2-digit' });
    meta.appendChild(sender); meta.appendChild(time);
    div.appendChild(txt); div.appendChild(meta);
    area.appendChild(div);
  });
  area.scrollTop = area.scrollHeight;
}

async function loadUsers() {
  const data = await fetchJSON('/users');
  const list = el('directUsersList');
  list.innerHTML = '';
  if (!data?.success || !data.users?.length) { list.innerHTML = '<div class="item">Ingen brukere</div>'; return; }
  const mapped = await Promise.all(data.users.map(async u => {
    const presence = (await fetchJSON('/presence/batch', { method: 'POST', body: JSON.stringify({ users: [u] }) }))?.presence?.[0];
    return { username: u, lastSeen: presence?.lastSeen };
  }));
  renderDirect(mapped, list, selectDirectUser);
}

async function loadGroups() {
  const data = await fetchJSON('/groups');
  const list = el('groupsList');
  list.innerHTML = '';
  if (!data?.success || !data.groups?.length) { list.innerHTML = '<div class="item">Ingen grupper</div>'; return; }
  renderGroups(data.groups, list, selectGroup);
}

function renderSettings() {
  const body = el('modalBody');
  el('modalTitle').textContent = 'Innstillinger';
  body.innerHTML = `
    <div class="panel">
      <h3>🎨 Tema</h3>
      <div class="actions">
        <button class="btn btn-primary" id="darkTheme">Mørk</button>
        <button class="btn btn-ghost" id="lightTheme">Lys</button>
      </div>
      <h3>🔔 Varsler</h3>
      <div class="actions">
        <button class="btn btn-primary" id="notifyOn">På</button>
        <button class="btn btn-ghost" id="notifyOff">Av</button>
      </div>
      <h3>🔐 2FA</h3>
      <div class="actions">
        <button class="btn btn-primary" id="enable2fa">Aktiver 2FA</button>
        <button class="btn btn-ghost" id="disable2fa">Deaktiver 2FA</button>
      </div>
      <h3>📤 Nøkkelen min</h3>
      <div class="key-share">
        <label>Eksporter/Import nøkle</label>
        <div class="copy-row"><input id="exportKey" class="input-text readonly" readonly><button class="btn btn-small" data-action="export-key">Eksporter</button></div>
        <div class="copy-row" style="margin-top:8px"><input id="importKey" class="input-text" placeholder="Lim inn nøkkel"><button class="btn btn-primary btn-small" data-action="import-key">Importer</button></div>
      </div>
      <h3>🧹 Data</h3>
      <button class="btn btn-ghost" id="clearChat">Slett valgt chat</button>
    </div>
  `;
  el('modalOverlay').style.display = 'flex';
  body.querySelectorAll('button[data-action="export-key"]').forEach(b => b.addEventListener('click', async () => {
    const key = appState.partnerKeys[appState.currentChat.id];
    el('exportKey').value = key || '';
  }));
  body.querySelectorAll('button[data-action="import-key"]').forEach(b => b.addEventListener('click', async () => {
    const key = el('importKey').value.trim();
    if (!key) { toast('Lim inn en nøkkel.', 'error'); return; }
    appState.partnerKeys[appState.currentChat.id] = key;
    localStorage.setItem('partnerKeys', JSON.stringify(appState.partnerKeys));
    await fetchJSON('/key/import', { method: 'POST', body: JSON.stringify({ key }) });
    await fetchJSON('/key/export?data=' + encodeURIComponent(key));
    toast('Nøkkel lagret.', 'success');
    await loadMessages();
  }));
  body.querySelector('#enable2fa').addEventListener('click', async () => {
    const r = await fetchJSON('/2fa/enable', { method: 'POST' });
    if (r?.success) { toast('2FA aktivert. Sjekk URI / hemmelighet.', 'success'); }
    else toast(r?.message || 'Feil.', 'error');
  });
  body.querySelector('#disable2fa').addEventListener('click', async () => {
    const r = await fetchJSON('/2fa/disable', { method: 'POST' });
    if (r?.success) { toast('2FA deaktivert.', 'success'); }
    else toast(r?.message || 'Feil.', 'error');
  });
  body.querySelector('#darkTheme').addEventListener('click', async () => { await setTheme('dark'); });
  body.querySelector('#lightTheme').addEventListener('click', async () => { await setTheme('light'); });
  body.querySelector('#notifyOn').addEventListener('click', async () => { await pullNotifications(); await setNotificationSetting(true); });
  body.querySelector('#notifyOff').addEventListener('click', async () => { await setNotificationSetting(false); });
}

async function setTheme(theme) {
  document.body.classList.toggle('theme-light', theme === 'light');
  localStorage.setItem('theme', theme);
  await fetchJSON('/theme', { method: 'POST', body: JSON.stringify({ theme }) });
  toast('Tema: ' + (theme === 'light' ? 'Lys' : 'Mørk'), 'success');
  el('modalOverlay').style.display = 'none';
}

async function setNotificationSetting(enabled) {
  await fetchJSON('/settings/notifications', { method: 'POST', body: JSON.stringify({ enabled }) });
  toast(enabled ? 'Varsler på.' : 'Varsler av.', 'success');
  el('modalOverlay').style.display = 'none';
}

function openModal(title, html) {
  el('modalTitle').textContent = title;
  el('modalBody').innerHTML = html;
  el('modalOverlay').style.display = 'flex';
}
function closeModal() { el('modalOverlay').style.display = 'none'; }

function bindSearch(chatId, type) {
  const btn = el('searchToggle');
  btn?.addEventListener('click', () => {
    const html = `<input id="searchQuery" class="input-text" placeholder="Søk i meldinger..."><button id="searchRun" class="btn btn-primary">Søk</button><div id="searchResults"></div>`;
    openModal('Søk', html);
    const run = async () => {
      const q = el('searchQuery').value.trim();
      el('searchResults').innerHTML = 'Søker...';
      const partner = type === 'user' ? chatId : 'group:' + chatId;
      const r = type === 'user' ? await fetchJSON('/search?q=' + encodeURIComponent(q) + '&partner=' + encodeURIComponent(partner)) : { success:true, messages:[] };
      const list = r?.messages || [];
      const out = el('searchResults');
      out.innerHTML = '';
      if (!list.length) { out.innerHTML = '<div class="item">Ingen treff</div>'; return; }
      list.forEach(m => {
        const d = document.createElement('div'); d.className = 'item';
        d.innerHTML = `<div><div class="name">${m.sender}: ${m.text.slice(0,120)}</div><div class="status">${new Date(m.timestamp).toLocaleString('no-NO')}</div></div>`;
        out.appendChild(d);
      });
    };
    el('searchRun')?.addEventListener('click', run);
    el('searchQuery')?.addEventListener('keypress', (e) => { if (e.key === 'Enter') run(); });
    run();
  });
}

async function createGroup() {
  const name = prompt('Gruppenavn:');
  if (!name) return;
  const users = (await fetchJSON('/users'))?.users || [];
  const choices = users.map(u => `<label><input type="checkbox" value="${u}"> ${u}</label>`).join('');
  const membersInput = prompt('Velg medlemmer (kommaseparert):\n' + choices);
  const members = (membersInput || '').split(',').map(x => x.trim()).filter(Boolean);
  const r = await fetchJSON('/groups', { method: 'POST', body: JSON.stringify({ name, members }) });
  if (r?.success) { toast('Gruppe opprettet.', 'success'); await loadGroups(); }
  else toast(r?.message || 'Feil.', 'error');
}

function startPolling() {
  if (appState.pollTimer) clearInterval(appState.pollTimer);
  appState.pollTimer = setInterval(async () => {
    if (appState.currentChat?.type === 'user') await loadMessages();
    else if (appState.currentChat?.type === 'group') await loadGroupMessages(appState.currentChat.id);
  }, 3000);
}

function handleAppVisibility() {
  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'visible' && appState.currentChat?.type === 'user') await loadMessages();
  });
}

function initServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').then(() => toast('PWA aktiv.', 'success')).catch((e) => console.log('SW', e));
  }
}

function initPWAInstall() {
  let deferredPrompt;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const btn = document.createElement('button');
    btn.className = 'btn btn-ghost btn-small';
    btn.textContent = '📲 Installer app';
    btn.addEventListener('click', async () => {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      toast(outcome === 'accepted' ? 'Installasjon startet.' : 'Ingen installasjon.', 'info');
      deferredPrompt = null;
    });
    el('chatActions')?.appendChild(btn);
  });
}

async function pullNotifications() {
  const r = await fetchJSON('/notifications');
  (r?.notifications || []).forEach(n => toast('🔔 ' + (n.title || 'Melding'), 'success'));
}

function wireChatEvents() {
  qsa('[data-action="copy-my-key"]').forEach(b => b.addEventListener('click', () => {
    const v = el('myKey')?.value;
    if (v) { navigator.clipboard?.writeText(v).then(() => toast('Nøkkel kopiert.', 'success')); }
  }));
  qsa('[data-action="add-partner-key"]').forEach(b => b.addEventListener('click', async () => {
    const partner = appState.currentChat?.id;
    const key = el('partnerKey')?.value.trim();
    if (!key || !partner) { toast('Lim inn nøkkel.', 'error'); return; }
    appState.partnerKeys[partner] = key;
    localStorage.setItem('partnerKeys', JSON.stringify(appState.partnerKeys));
    await fetchJSON('/key/export?data=' + encodeURIComponent(key));
    await fetchJSON('/key/import', { method: 'POST', body: JSON.stringify({ key }) });
    toast('Nøkkel lagret.', 'success');
    el('partnerKey').value = '';
    await loadMessages();
  }));
  document.body.addEventListener('click', (e) => {
    if (e.target.closest('#closeModal')) closeModal();
  });
  el('logoutBtn')?.addEventListener('click', logout);
  el('createGroupBtn')?.addEventListener('click', createGroup);
  el('settingsBtn')?.addEventListener('click', renderSettings);
  el('sendText')?.addEventListener('click', sendMessage);
}

function applySavedTheme() {
  const theme = localStorage.getItem('theme') || 'dark';
  document.body.classList.toggle('theme-light', theme === 'light');
}

async function authedBoot() {
  wireChatEvents();
  applySavedTheme();
  startPolling();
  handleAppVisibility();
  initServiceWorker();
  initPWAInstall();
  await loadUsers();
  await loadGroups();
}

function applyBoot() {
  if (window.location.pathname.includes('/login') || window.location.pathname === '/login') return;
  if (appState.currentUser) authedBoot();
  if (typeof register !== 'undefined') {
    el('btnConfirmTwoFaReg')?.addEventListener('click', confirm2FARegister);
    el('btnSkipTwoFaReg')?.addEventListener('click', skip2FA);
  }
}

function handleLoginSubmit() { if (el('loginForm')) el('loginForm').addEventListener('submit', async (e) => { e.preventDefault(); await login(); }); }
function handleRegisterSubmit() { if (el('registerForm')) el('registerForm').addEventListener('submit', async (e) => { e.preventDefault(); await register(); }); }

document.addEventListener('DOMContentLoaded', () => {
  if (window.__APP__?.username) { handleLoginSubmit(); handleRegisterSubmit(); applyBoot(); }
  else { handleLoginSubmit(); handleRegisterSubmit(); }
});
