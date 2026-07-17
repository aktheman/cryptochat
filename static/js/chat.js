(() => {
  const qs = (sel, root = document) => root.querySelector(sel);
  let currentUser = '';
  let activeChat = null;

  function setStatus(msg, type = 'error') {
    const el = qs('#status');
    if (!el) return;
    el.textContent = msg || '';
    el.className = 'status ' + type;
    el.style.display = msg ? 'block' : 'none';
  }

  function appendMessage(message) {
    const list = qs('#messages');
    if (!list) return;
    const item = document.createElement('div');
    item.className = 'msg ' + (message.sender === currentUser ? 'self' : 'other');
    item.innerHTML = '<div class="meta"><span class="sender">' + message.sender + '</span><span class="time">' + new Date(message.timestamp).toLocaleString('no-NO') + '</span></div><div>' + (message.text || message.filename || message.type) + '</div><div class="meta"><span class="read">' + (message.read ? 'Lest' : 'Ikke lest') + '</span></div>';
    list.appendChild(item);
    list.scrollTop = list.scrollHeight;
  }

  async function loadUsers() {
    try {
      const res = await fetch('/users');
      const data = await res.json();
      const list = qs('#users');
      if (!list) return;
      list.innerHTML = '';
      (data.users || []).forEach(u => {
        const item = document.createElement('div');
        item.className = 'item';
        item.innerHTML = '<div class="avatar">' + u[0].toUpperCase() + '</div><div class="name">' + u + '</div>';
        item.addEventListener('click', () => loadChat(u));
        list.appendChild(item);
      });
    } catch (e) {
      setStatus('Kunne ikke hente brukere');
    }
  }

  async function loadGroups() {
    try {
      const res = await fetch('/groups');
      const data = await res.json();
      const list = qs('#groups');
      if (!list) return;
      list.innerHTML = '';
      (data.groups || []).forEach(g => {
        const item = document.createElement('div');
        item.className = 'item';
        item.innerHTML = '<div class="name">' + g.name + '</div>';
        item.addEventListener('click', () => loadGroup(g.id));
        list.appendChild(item);
      });
    } catch (e) {
      setStatus('Kunne ikke hente grupper');
    }
  }

  async function loadChat(target) {
    activeChat = { target, type: 'user' };
    qs('#recipient').value = target;
    qs('#chatTitle').textContent = target;
    const list = qs('#messages');
    list.innerHTML = '';
    const res = await fetch('/messages/' + encodeURIComponent(target));
    const data = await res.json();
    (data.messages || []).forEach(m => appendMessage({ ...m, sender: m.sender }));
    try { await fetch('/read_receipts/' + encodeURIComponent(target), { method: 'POST' }); } catch (e) {}
  }

  async function loadGroup(groupId) {
    activeChat = { target: groupId, type: 'group' };
    qs('#recipient').value = groupId;
    qs('#chatTitle').textContent = 'Gruppe: ' + groupId;
    const list = qs('#messages');
    list.innerHTML = '';
    const res = await fetch('/groups/' + encodeURIComponent(groupId) + '/messages');
    const data = await res.json();
    (data.messages || []).forEach(m => appendMessage({ ...m, sender: m.sender }));
  }

  async function sendMessage() {
    const input = qs('#messageInput');
    if (!input || !input.value.trim() || !activeChat) return;
    const text = input.value.trim();
    try {
      const url = activeChat.type === 'group' ? '/groups/' + encodeURIComponent(activeChat.target) + '/send' : '/send';
      const body = { ciphertext: text };
      if (activeChat.type === 'user') body.recipient = activeChat.target;
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Feil');
      input.value = '';
      if (activeChat.type === 'user') await loadChat(activeChat.target);
      else await loadGroup(activeChat.target);
    } catch (e) {
      setStatus('Kunne ikke sende: ' + e.message);
    }
  }

  async function createGroup() {
    const name = prompt('Gruppenavn:');
    if (!name) return;
    const members = prompt('Medlemmer (kommaseparert brukernavn):', '').split(',').map(x => x.trim()).filter(Boolean);
    try {
      const res = await fetch('/groups', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, members }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Feil');
      setStatus('Gruppe opprettet', 'success');
      loadGroups();
    } catch (e) {
      setStatus('Kunne ikke opprette gruppe: ' + e.message);
    }
  }

  async function toggleTheme() {
    const next = document.body.dataset.theme === 'light' ? 'dark' : 'light';
    document.body.dataset.theme = next;
    try { await fetch('/theme', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ theme: next }) }); } catch (e) {}
  }

  async function searchMessages() {
    const query = qs('#searchInput')?.value.trim();
    const partner = qs('#searchPartner')?.value.trim();
    if (!query || !partner) return setStatus('Søk trenger tekst og kontakt');
    try {
      const res = await fetch('/search?q=' + encodeURIComponent(query) + '&partner=' + encodeURIComponent(partner));
      const data = await res.json();
      const list = qs('#messages');
      list.innerHTML = '';
      (data.messages || []).forEach(m => appendMessage({ ...m, sender: m.sender }));
      setStatus(data.messages.length + ' treff', 'success');
    } catch (e) {
      setStatus('Søk feilet: ' + e.message);
    }
  }

  async function enable2FA() {
    try {
      const data = await fetch('/auth/2fa/enable', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }).then(r => r.json());
      if (!data.success) throw new Error(data.message);
      const qr = qs('#qrWrap');
      if (qr) { qr.innerHTML = '<img src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=' + encodeURIComponent(data.uri) + '" alt="2FA QR" />'; }
      setStatus('2FA aktivert: ' + (data.secret || ''), 'success');
    } catch (e) {
      setStatus('2FA feilet: ' + e.message);
    }
  }

  async function logout() {
    try { await fetch('/auth/logout', { method: 'POST' }); } catch (e) {}
    window.location.href = '/login';
  }

  async function init() {
    const userEl = qs('#current-user');
    currentUser = userEl ? (userEl.textContent || '').trim() : '';
    if (!currentUser) { window.location.href = '/login'; return; }

    qs('#logoutBtn')?.addEventListener('click', logout);
    qs('#sendBtn')?.addEventListener('click', sendMessage);
    qs('#searchBtn')?.addEventListener('click', searchMessages);
    qs('#themeBtn')?.addEventListener('click', toggleTheme);
    qs('#createGroupBtn')?.addEventListener('click', createGroup);
    qs('#fa2Btn')?.addEventListener('click', enable2FA);

    const msgInput = qs('#messageInput');
    if (msgInput) msgInput.addEventListener('keydown', e => { if (e.key === 'Enter') sendMessage(); });

    const fileInput = qs('#fileInput');
    if (fileInput) fileInput.addEventListener('change', async () => {
      const file = fileInput.files[0];
      if (!file || !activeChat) return;
      const form = new FormData();
      form.append('file', file);
      form.append('recipient', activeChat.target);
      try {
        const res = await fetch('/upload', { method: 'POST', body: form });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        setStatus('Fil opplastet', 'success');
        if (activeChat.type === 'user') await loadChat(activeChat.target); else await loadGroup(activeChat.target);
      } catch (e) {
        setStatus('Filopplasting feilet: ' + e.message);
      }
    });

    await loadUsers();
    await loadGroups();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
