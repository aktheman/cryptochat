(() => {
  'use strict';
  const API_BASE = '';
  let currentUser = window.__APP__?.username || '';
  let activeChat = null;
  let polling = null;
  let sharedKeyCache = {};

  const qs = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function el(tag, attrs = {}, children = []) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (k === 'text') node.textContent = v;
      else if (k === 'html') node.innerHTML = v;
      else if (k.startsWith('data-')) node.dataset[k.slice(5)] = v;
      else if (k === 'class') node.className = v;
      else node.setAttribute(k, v);
    }
    for (const child of children) {
      node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
    }
    return node;
  }

  async function postJSON(path, body) {
    const res = await fetch(API_BASE + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || data.error || 'HTTP ' + res.status);
    return data;
  }

  function toast(message, type = 'error') {
    let container = qs('#toasts');
    if (!container) {
      container = el('div', { id: 'toasts', class: 'toasts' });
      document.body.appendChild(container);
    }
    const item = el('div', { class: 'toast ' + type, text: message });
    container.appendChild(item);
    setTimeout(() => item.remove(), 2500);
  }

  async function getOrCreateIdentity() {
    let stored = localStorage.getItem('identityKeyPair');
    if (stored) return JSON.parse(stored);
    const keyPair = await window.__CRYPTO__.generateKeyPair();
    localStorage.setItem('identityKeyPair', JSON.stringify(keyPair));
    return keyPair;
  }

  async function publishIdentity() {
    const keyPair = await getOrCreateIdentity();
    await postJSON('/key/publish', { publicKeyPem: keyPair.publicKeyPem });
    return keyPair;
  }

  async function fetchPartnerPublicKey(username) {
    const res = await fetch('/keys/' + encodeURIComponent(username));
    const data = await res.json();
    if (!data.success || !data.publicKey) throw new Error(data.message || 'Kunne ikke hente nøkkel');
    return data.publicKey;
  }

  async function getSharedKey(partner) {
    if (sharedKeyCache[partner]) return sharedKeyCache[partner];
    const myKeyPair = await getOrCreateIdentity();
    const theirPublicKeyPem = await fetchPartnerPublicKey(partner);
    const sharedKey = await window.__CRYPTO__.getSharedKey(theirPublicKeyPem);
    sharedKeyCache[partner] = sharedKey;
    return sharedKey;
  }

  async function encryptFor(plaintext, partner) {
    const key = await getSharedKey(partner);
    const encrypted = await window.__CRYPTO__.encryptMessage(plaintext, key);
    return JSON.stringify(encrypted);
  }

  async function decryptFrom(packed, partner) {
    try {
      const encrypted = JSON.parse(packed);
      const key = await getSharedKey(partner);
      return await window.__CRYPTO__.decryptMessage(encrypted, key);
    } catch (e) {
      return '[Kunne ikke dekryptere] ' + packed;
    }
  }

  async function encryptGroupMessage(plaintext, groupId) {
    const stored = localStorage.getItem('groupKeys') || '{}';
    const keys = JSON.parse(stored);
    if (!keys[groupId]) {
      const groupKey = await window.crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
      const exported = await window.crypto.subtle.exportKey('jwk', groupKey);
      keys[groupId] = exported.k;
      localStorage.setItem('groupKeys', JSON.stringify(keys));
    }
    const aesKey = await window.crypto.subtle.importKey('jwk', { kty: 'oct', alg: 'A256GCM', k: keys[groupId] }, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
    const encrypted = await window.__CRYPTO__.encryptMessage(plaintext, aesKey);
    return JSON.stringify(encrypted);
  }

  async function decryptGroupMessage(packed, groupId) {
    try {
      const encrypted = JSON.parse(packed);
      const stored = localStorage.getItem('groupKeys') || '{}';
      const keys = JSON.parse(stored);
      if (!keys[groupId]) throw new Error('Mangler gruppenøkkel');
      const aesKey = await window.crypto.subtle.importKey('jwk', { kty: 'oct', alg: 'A256GCM', k: keys[groupId] }, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
      return await window.__CRYPTO__.decryptMessage(encrypted, aesKey);
    } catch (e) {
      return '[Kunne ikke dekryppere gruppe] ' + packed;
    }
  }

  function buildApp() {
    const app = qs('#app');
    if (!app) return;
    app.innerHTML = '';
    app.appendChild(buildHeader());
    app.appendChild(buildBody());
  }

  function buildHeader() {
    const header = el('header', { class: 'header' }, [
      el('div', { class: 'header-left' }, [
        el('h1', { text: 'CryptoChat', class: 'brand' }),
        el('button', { id: 'logoutBtn', class: 'btn btn-small btn-ghost', text: 'Logg ut' }),
      ]),
      el('div', { class: 'header-actions' }, [
        el('button', { id: 'themeBtn', class: 'btn btn-small btn-ghost', text: '🌙 Tema' }),
        el('button', { id: 'fa2Btn', class: 'btn btn-small btn-ghost', text: '🔐 2FA' }),
      ]),
    ]);
    header.querySelector('#logoutBtn').addEventListener('click', logout);
    header.querySelector('#themeBtn').addEventListener('click', toggleTheme);
    header.querySelector('#fa2Btn').addEventListener('click', enable2FA);
    return header;
  }

  function buildBody() {
    const row = el('div', { class: 'app-row' });
    const sidebar = el('aside', { class: 'sidebar' });
    sidebar.appendChild(buildSidebarSection('MELDINGER', 'usersList', buildUsersList));
    sidebar.appendChild(buildSidebarSection('GRUPPER', 'groupsList', buildGroupsList, [
      el('button', { id: 'createGroupBtn', class: 'btn btn-small btn-ghost', text: '+ Ny gruppe' })
    ]));
    const chatMain = el('main', { class: 'chat-main' });
    chatMain.appendChild(buildChatHeader());
    chatMain.appendChild(buildMessages());
    chatMain.appendChild(buildComposer());
    row.appendChild(sidebar);
    row.appendChild(chatMain);
    return row;
  }

  function buildSidebarSection(title, listId, renderFn, extraChildren = []) {
    const section = el('div', { class: 'section' });
    section.appendChild(el('div', { class: 'section-title', text: title }));
    section.appendChild(el('div', { id: listId, class: 'list' }));
    extraChildren.forEach(c => section.appendChild(c));
    return section;
  }

  function buildUsersList() {
    const list = qs('#usersList');
    if (!list) return;
    list.innerHTML = '';
    (window.__APP__.users || []).forEach(u => {
      const item = el('div', { class: 'item', 'data-user': u.username || u }, [
        el('div', { class: 'avatar', text: (u.username || u)[0].toUpperCase() }),
        el('div', { class: 'name', text: u.username || u }),
      ]);
      item.addEventListener('click', () => openChat(u.username || u));
      list.appendChild(item);
    });
  }

  function buildGroupsList() {
    const list = qs('#groupsList');
    if (!list) return;
    list.innerHTML = '';
    (window.__APP__.groups || []).forEach(g => {
      const item = el('div', { class: 'item', 'data-group-id': g.id }, [
        el('div', { class: 'name', text: g.name }),
      ]);
      item.addEventListener('click', () => openGroup(g.id));
      list.appendChild(item);
    });
  }

  function buildChatHeader() {
    const header = el('header', { class: 'chat-header' }, [
      el('div', {}, [
        el('div', { id: 'chatTitle', class: 'chat-title', text: 'Velg en samtale' }),
        el('div', { id: 'chatMeta', class: 'chat-meta', text: '' }),
      ]),
      el('div', { class: 'chat-actions' }, [
        el('input', { id: 'searchPartner', class: 'input-text', placeholder: 'Kontakt for søk', autocomplete: 'off' }),
        el('input', { id: 'searchInput', class: 'input-text', placeholder: 'Søk i meldinger...', autocomplete: 'off' }),
        el('button', { id: 'searchBtn', class: 'btn btn-small btn-ghost', text: 'Søk' }),
      ]),
    ]);
    header.querySelector('#searchBtn').addEventListener('click', searchMessages);
    return header;
  }

  function buildMessages() {
    const wrap = el('div', { class: 'messages' });
    wrap.id = 'messages';
    wrap.appendChild(el('div', { id: 'emptyState', class: 'empty-state', html: '<div class="empty-icon">💬</div><h3>Ingen samtale valgt</h3><p>Velg en kontakt eller gruppe for å starte en sikker chat.</p>' }));
    return wrap;
  }

  function buildComposer() {
    const composer = el('div', { id: 'composer', class: 'composer', style: 'display:none' });
    const actions = el('div', { class: 'composer-actions' });
    const row = el('div', { class: 'composer-row' });
    row.appendChild(el('input', { id: 'messageInput', class: 'input-text', placeholder: 'Skriv en kryptert melding...', autocomplete: 'off' }));
    row.appendChild(el('button', { id: 'sendBtn', class: 'btn btn-primary', text: 'Send' }));
    actions.appendChild(el('input', { id: 'fileInput', type: 'file', class: 'input-text' }));
    composer.appendChild(actions);
    composer.appendChild(row);
    composer.querySelector('#sendBtn').addEventListener('click', sendMessage);
    const input = composer.querySelector('#messageInput');
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendMessage(); });
    composer.querySelector('#fileInput').addEventListener('change', () => {
      const file = qs('#fileInput').files[0];
      if (file && activeChat) uploadFile(file);
    });
    return composer;
  }

  async function loadUsers() {
    try {
      const res = await fetch('/users');
      const data = await res.json();
      window.__APP__.users = data.users || [];
      buildUsersList();
    } catch (e) {
      toast('Kunne ikke hente brukere');
    }
  }

  async function loadGroups() {
    try {
      const res = await fetch('/groups');
      const data = await res.json();
      window.__APP__.groups = data.groups || [];
      buildGroupsList();
    } catch (e) {
      toast('Kunne ikke hente grupper');
    }
  }

  function openChat(target) {
    setActiveTarget({ type: 'user', target });
    qs('#chatTitle').textContent = target;
    qs('#chatMeta').textContent = '';
    clearMessages();
    loadChat(target);
  }

  async function loadChat(target) {
    try {
      const res = await fetch('/messages/' + encodeURIComponent(target));
      const data = await res.json();
      const list = qs('#messages');
      if (!list) return;
      list.innerHTML = '';
      if (!(data.messages || []).length) {
        list.appendChild(el('div', { class: 'empty-state', html: '<div class="empty-icon">💬</div><p>Ingen meldinger enda</p>' }));
      } else {
        for (const m of data.messages || []) {
          if (m.type === 'file') {
            appendMessage({ ...m, text: m.filename || '[fil]' });
          } else {
            const decrypted = await decryptFrom(m.text || '', target);
            appendMessage({ ...m, text: decrypted });
          }
        }
      }
      try { await postJSON('/read_receipts/' + encodeURIComponent(target), {}); } catch (e) {}
    } catch (e) {
      toast('Kunne ikke hente meldinger');
    }
  }

  function openGroup(groupId) {
    const group = (window.__APP__.groups || []).find(g => g.id === groupId);
    setActiveTarget({ type: 'group', target: groupId });
    qs('#chatTitle').textContent = group ? group.name : 'Gruppe';
    qs('#chatMeta').textContent = '';
    clearMessages();
    loadGroup(groupId);
  }

  async function loadGroup(groupId) {
    try {
      const res = await fetch('/groups/' + encodeURIComponent(groupId) + '/messages');
      const data = await res.json();
      const list = qs('#messages');
      if (!list) return;
      list.innerHTML = '';
      if (!(data.messages || []).length) {
        list.appendChild(el('div', { class: 'empty-state', html: '<div class="empty-icon">👥</div><p>Ingen gruppemeldinger enda</p>' }));
      } else {
        for (const m of data.messages || []) {
          if (m.type === 'file') {
            appendMessage({ ...m, text: m.filename || '[fil]' });
          } else {
            const decrypted = await decryptGroupMessage(m.text || '', groupId);
            appendMessage({ ...m, text: decrypted });
          }
        }
      }
    } catch (e) {
      toast('Kunne ikke hente gruppemeldinger');
    }
  }

  function appendMessage(message) {
    const list = qs('#messages');
    if (!list) return;
    const item = el('div', { class: 'msg ' + (message.sender === currentUser ? 'sent' : 'received') });
    item.innerHTML = '<div class="meta"><span class="sender">' + (message.sender || '') + '</span><span class="time">' + new Date(message.timestamp).toLocaleString('no-NO') + '</span></div><div>' + (message.text || message.filename || message.type || '') + '</div><div class="meta"><span class="read">' + (message.read ? 'Lest' : 'Ikke lest') + '</span></div>';
    list.appendChild(item);
    list.scrollTop = list.scrollHeight;
  }

  function clearMessages() {
    const list = qs('#messages');
    if (list) list.innerHTML = '';
  }

  function setActiveTarget(chat) {
    activeChat = chat;
    const composer = qs('#composer');
    if (composer) composer.style.display = chat ? 'flex' : 'none';
  }

  async function sendMessage() {
    const input = qs('#messageInput');
    if (!input || !input.value.trim() || !activeChat) return;
    const text = input.value.trim();
    try {
      await publishIdentity();
      let ciphertext;
      if (activeChat.type === 'user') {
        ciphertext = await encryptFor(text, activeChat.target);
      } else {
        ciphertext = await encryptGroupMessage(text, activeChat.target);
      }
      const url = activeChat.type === 'group' ? '/groups/' + encodeURIComponent(activeChat.target) + '/send' : '/send';
      const body = { ciphertext };
      if (activeChat.type === 'user') body.recipient = activeChat.target;
      await postJSON(url, body);
      input.value = '';
      if (activeChat.type === 'user') await loadChat(activeChat.target); else await loadGroup(activeChat.target);
    } catch (e) {
      toast('Kunne ikke sende: ' + e.message);
    }
  }

  async function uploadFile(file) {
    if (!activeChat || !file) return;
    const form = new FormData();
    form.append('file', file);
    form.append('recipient', activeChat.target);
    try {
      const res = await fetch('/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Feil');
      toast('Fil opplastet', 'success');
      if (activeChat.type === 'user') await loadChat(activeChat.target); else await loadGroup(activeChat.target);
    } catch (e) {
      toast('Filopplasting feilet: ' + e.message);
    }
  }

  async function createGroup() {
    const name = prompt('Gruppenavn:');
    if (!name) return;
    const members = (prompt('Medlemmer (kommaseparert brukernavn):', '') || '').split(',').map(x => x.trim()).filter(Boolean);
    try {
      const data = await postJSON('/groups', { name, members });
      toast('Gruppe opprettet', 'success');
      await loadGroups();
    } catch (e) {
      toast('Kunne ikke opprette gruppe: ' + e.message);
    }
  }

  async function toggleTheme() {
    const next = document.body.dataset.theme === 'light' ? 'dark' : 'light';
    document.body.dataset.theme = next;
    localStorage.setItem('theme', next);
    try { await postJSON('/theme', { theme: next }); } catch (e) {}
  }

  async function searchMessages() {
    const query = qs('#searchInput')?.value.trim();
    const partner = qs('#searchPartner')?.value.trim();
    if (!query || !partner) return toast('Søk trenger tekst og kontakt');
    try {
      const res = await fetch('/search?q=' + encodeURIComponent(query) + '&partner=' + encodeURIComponent(partner));
      const data = await res.json();
      const list = qs('#messages');
      list.innerHTML = '';
      (data.messages || []).forEach(async m => {
        const decrypted = await decryptFrom(m.text || '', partner);
        appendMessage({ ...m, text: decrypted });
      });
      toast(data.messages.length + ' treff', 'success');
    } catch (e) {
      toast('Søk feilet: ' + e.message);
    }
  }

  async function enable2FA() {
    try {
      const data = await postJSON('/auth/2fa/enable', {});
      const qr = window.__APP__.qrWrap;
      if (!qr) return;
      qr.innerHTML = '<img src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=' + encodeURIComponent(data.uri) + '" alt="2FA QR" /><div>' + (data.secret || '') + '</div>';
      toast('2FA-URI generert', 'success');
    } catch (e) {
      toast('2FA feilet: ' + e.message);
    }
  }

  async function logout() {
    try { await postJSON('/auth/logout', {}); } catch (e) {}
    window.location.href = '/login';
  }

  async function init() {
    if (!currentUser) { window.location.href = '/login'; return; }
    buildApp();
    window.__APP__.qrWrap = el('div', { id: 'qrWrap', style: 'display:none' });
    document.body.appendChild(window.__APP__.qrWrap);
    qs('#createGroupBtn')?.addEventListener('click', createGroup);
    try { await publishIdentity(); } catch (e) { console.error(e); }
    await loadUsers();
    await loadGroups();
    startPolling();
  }

  function startPolling() {
    stopPolling();
    polling = setInterval(async () => {
      if (activeChat) {
        if (activeChat.type === 'user') await loadChat(activeChat.target);
        else await loadGroup(activeChat.target);
      }
      await loadUsers();
      await loadGroups();
    }, 2500);
  }

  function stopPolling() {
    if (polling) { clearInterval(polling); polling = null; }
  }

  ready(init);
})();
