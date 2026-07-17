(() => {
  const API_BASE = '';
  let currentUser = null;
  let activeChat = null; // { type: 'user'|'group', target: string }
  let polling = null;
  let presenceTimers = {};

  function qs(selector, root = document) {
    return root.querySelector(selector);
  }

  function el(tag, attrs = {}, children = []) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (k === 'text') node.textContent = v;
      else if (k.startsWith('data-')) node.dataset[k.slice(5)] = v;
      else if (k === 'class') node.className = v;
      else node.setAttribute(k, v);
    }
    for (const child of children) {
      node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
    }
    return node;
  }

  async function postJSON(url, body) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body || {}),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || data.error || 'HTTP ' + res.status);
    return data;
  }

  function setStatus(message, type = 'error') {
    const out = qs('#status');
    if (!out) return;
    out.textContent = message || '';
    out.className = 'status ' + type;
    out.style.display = message ? 'block' : 'none';
  }

  function appendMessage(message) {
    const list = qs('#messages');
    if (!list) return;
    const item = el('div', { class: 'message ' + (message.self ? 'self' : 'other') }, [
      el('div', { class: 'message-meta', text: message.sender + ' · ' + new Date(message.timestamp).toLocaleString('no-NO') }),
      message.self_destruct_at ? el('div', { class: 'message-meta', text: 'Selvødeleggende' }) : null,
      el('div', { class: 'message-text', text: message.text || message.filename || message.type }),
      el('div', { class: 'message-meta', text: message.read ? 'Lest' : 'Ikke lest' }),
    ].filter(Boolean));
    list.appendChild(item);
    list.scrollTop = list.scrollHeight;
  }

  async function loadChat(target, type = 'user') {
    activeChat = { target, type };
    qs('#recipient').value = target;
    const list = qs('#messages');
    list.innerHTML = '';
    const res = await fetch(`/messages/${encodeURIComponent(target)}`);
    const data = await res.json();
    if (data.messages) {
      data.messages.forEach((m) => appendMessage({ ...m, self: m.sender === currentUser }));
    }
    await markRead(target);
  }

  async function loadGroup(groupId) {
    activeChat = { target: groupId, type: 'group' };
    qs('#recipient').value = groupId;
    const list = qs('#messages');
    list.innerHTML = '';
    const res = await fetch(`/groups/${encodeURIComponent(groupId)}/messages`);
    const data = await res.json();
    if (data.messages) {
      data.messages.forEach((m) => appendMessage({ ...m, self: m.sender === currentUser }));
    }
  }

  async function markRead(target) {
    try {
      await postJSON(`/read_receipts/${encodeURIComponent(target)}`, {});
    } catch (e) {
      // non-critical
    }
  }

  async function sendMessage() {
    const input = qs('#message-input');
    if (!input) return;
    const text = input.value.trim();
    if (!text || !activeChat) return;
    try {
      const url = activeChat.type === 'group' ? `/groups/${encodeURIComponent(activeChat.target)}/send` : '/send';
      const body = { ciphertext: text };
      if (activeChat.type === 'user') body.recipient = activeChat.target;
      await postJSON(url, body);
      input.value = '';
      await refreshActiveChat();
    } catch (e) {
      setStatus('Kunne ikke sende melding: ' + e.message);
    }
  }

  async function refreshActiveChat() {
    if (!activeChat) return;
    if (activeChat.type === 'user') await loadChat(activeChat.target);
    else await loadGroup(activeChat.target);
  }

  async function uploadFile(file) {
    if (!activeChat || !file) return;
    const form = new FormData();
    form.append('file', file);
    form.append('recipient', activeChat.target);
    try {
      const res = await fetch('/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Opplasting feilet');
      setStatus('Fil opplastet', 'success');
      await refreshActiveChat();
    } catch (e) {
      setStatus('Filopplasting feilet: ' + e.message);
    }
  }

  async function loadUsers() {
    try {
      const res = await fetch('/users');
      const data = await res.json();
      renderUserList(data.users || []);
    } catch (e) {
      setStatus('Kunne ikke hente brukere');
    }
  }

  function renderUserList(users) {
    const list = qs('#users');
    if (!list) return;
    list.innerHTML = '';
    if (!users.length) {
      list.appendChild(el('div', { text: 'Ingen andre brukere', class: 'empty' }));
      return;
    }
    users.forEach((u) => {
      const item = el('div', { class: 'user-row', 'data-user': u }, [
        el('span', { text: u }),
        el('button', { text: 'Chat', class: 'btn btn-ghost btn-small', 'data-user': u }),
      ]);
      item.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (btn) loadChat(btn.dataset.user);
      });
      list.appendChild(item);
    });
  }

  async function loadGroups() {
    try {
      const res = await fetch('/groups');
      const data = await res.json();
      renderGroupList(data.groups || []);
    } catch (e) {
      setStatus('Kunne ikke hente grupper');
    }
  }

  function renderGroupList(groups) {
    const list = qs('#groups');
    if (!list) return;
    list.innerHTML = '';
    if (!groups.length) {
      list.appendChild(el('div', { text: 'Ingen grupper', class: 'empty' }));
      return;
    }
    groups.forEach((g) => {
      const item = el('div', { class: 'user-row', 'data-group-id': g.id }, [
        el('span', { text: g.name }),
        el('button', { text: 'Åpne', class: 'btn btn-ghost btn-small', 'data-group-id': g.id }),
      ]);
      item.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (btn) loadGroup(btn.dataset.groupId);
      });
      list.appendChild(item);
    });
  }

  async function createGroup() {
    const nameInput = qs('#group-name');
    const membersInput = qs('#group-members');
    const name = nameInput?.value.trim();
    const members = (membersInput?.value || '').split(',').map((x) => x.trim()).filter(Boolean);
    if (!name) return setStatus('Gruppenavn er påkrevd');
    try {
      await postJSON('/groups', { name, members });
      setStatus('Gruppe opprettet', 'success');
      nameInput.value = '';
      membersInput.value = '';
      loadGroups();
    } catch (e) {
      setStatus('Kunne ikke opprette gruppe: ' + e.message);
    }
  }

  async function toggleTheme() {
    const current = document.body.dataset.theme || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    document.body.dataset.theme = next;
    try {
      await postJSON('/theme', { theme: next });
    } catch (e) {
      // ignore
    }
  }

  async function searchMessages() {
    const query = qs('#search-input')?.value.trim();
    const partner = qs('#search-partner')?.value.trim();
    if (!query || !partner) return setStatus('Søk trenger tekst og kontakt');
    try {
      const res = await fetch(`/search?q=${encodeURIComponent(query)}&partner=${encodeURIComponent(partner)}`);
      const data = await res.json();
      setStatus(data.messages.length + ' treff', 'success');
      const list = qs('#messages');
      list.innerHTML = '';
      data.messages.forEach((m) => appendMessage({ ...m, self: m.sender === currentUser }));
    } catch (e) {
      setStatus('Søk feilet: ' + e.message);
    }
  }

  async function enable2FA() {
    try {
      const data = await postJSON('/auth/2fa/enable', {});
      const uri = data.uri;
      const qr = qs('#qrcode') || document.createElement('div');
      qr.id = 'qrcode';
      qr.innerHTML = '';
      const img = document.createElement('img');
      img.src = 'https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=' + encodeURIComponent(uri);
      img.alt = '2FA QR';
      qr.appendChild(img);
      const secretEl = qs('#twofa-secret');
      if (secretEl) secretEl.value = data.secret || '';
      const form = qs('#enable-2fa-form');
      if (form) form.style.display = 'none';
      const qrWrap = qs('#qrcode-wrap');
      if (qrWrap) {
        qrWrap.innerHTML = '';
        qrWrap.appendChild(qr);
      }
    } catch (e) {
      setStatus('2FA feilet: ' + e.message);
    }
  }

  async function logout() {
    try {
      await postJSON('/auth/logout', {});
    } finally {
      window.location.href = '/login';
    }
  }

  function startPolling() {
    stopPolling();
    polling = setInterval(() => {
      if (activeChat) refreshActiveChat();
      // presence heartbeat
      if (currentUser) {
        fetch('/presence/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ users: [currentUser] }),
        }).catch(() => {});
      }
    }, 2500);
  }

  function stopPolling() {
    if (polling) {
      clearInterval(polling);
      polling = null;
    }
  }

  async function init() {
    try {
      const userEl = qs('#current-user');
      if (userEl) currentUser = (userEl.textContent || '').trim();
      if (!currentUser) return; // session missing
      startPolling();
      await loadUsers();
      await loadGroups();
      if (qs('#search-button')) qs('#search-button').addEventListener('click', searchMessages);
      if (qs('#theme-toggle')) qs('#theme-toggle').addEventListener('click', toggleTheme);
      if (qs('#send-button')) qs('#send-button').addEventListener('click', sendMessage);
      if (qs('#create-group-button')) qs('#create-group-button').addEventListener('click', createGroup);
      if (qs('#enable-2fa-button')) qs('#enable-2fa-button').addEventListener('click', enable2FA);
      if (qs('#logout-button')) qs('#logout-button').addEventListener('click', logout);
      const keyInput = qs('#message-input');
      if (keyInput) {
        keyInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') sendMessage();
        });
      }
      const fileInput = qs('#file-input');
      if (fileInput) {
        fileInput.addEventListener('change', () => {
          if (fileInput.files[0]) uploadFile(fileInput.files[0]);
        });
      }
      try {
        await fetch('/sw.js');
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.register('/sw.js');
        }
      } catch (e) {
        // SW optional
      }
    } catch (e) {
      console.error('Chat init failed:', e);
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
