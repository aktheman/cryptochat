(() => {
  'use strict';

  async function safeJson(res) {
    try { return await res.json(); } catch { return {}; }
  }

  async function loadJSON(path) {
    const res = await fetch(path);
    const data = await safeJson(res);
    if (!res.ok) throw new Error(data.message || data.error || 'HTTP ' + res.status);
    return data;
  }
  function toast(message, type = 'error') {
    let container = document.getElementById('toasts');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toasts';
      container.className = 'toasts';
      document.body.appendChild(container);
    }
    const item = document.createElement('div');
    item.className = 'toast ' + type;
    item.textContent = message;
    container.appendChild(item);
    setTimeout(() => item.remove(), 2500);
  }

  function escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]);
  }

  function formatTime(iso) {
    try { return new Date(iso).toLocaleString('no-NO'); } catch { return iso; }
  }

  async function ensureIdentity() {
    try {
      await window.__CRYPTO__.getOrCreateIdentity();
    } catch (e) {
      console.warn('E2EE identity init failed', e);
    }
  }

  async function getPeerPublicKeyPem(user) {
    try {
      const data = await loadJSON('/keys/' + encodeURIComponent(user));
      return data.publicKey || null;
    } catch (e) {
      return null;
    }
  }

  async function encryptForPeer(plaintext, peerPublicKeyPem) {
    try {
      const key = await window.__CRYPTO__.getSharedKey(peerPublicKeyPem);
      const encrypted = await window.__CRYPTO__.encryptMessage(plaintext, key);
      return encrypted.ciphertext;
    } catch (e) {
      console.warn('encryption failed', e);
      return plaintext;
    }
  }

  async function decryptFromPeer(ciphertext, peerPublicKeyPem) {
    try {
      if (!ciphertext || !peerPublicKeyPem) return ciphertext;
      // frontend format: base64(iv).base64(ciphertext)
      const parts = String(ciphertext).split('.');
      if (parts.length !== 2) return ciphertext;
      const key = await window.__CRYPTO__.getSharedKey(peerPublicKeyPem);
      const decrypted = await window.__CRYPTO__.decryptMessage({ iv: parts[0], ciphertext: parts[1] }, key);
      return decrypted;
    } catch (e) {
      return '[Kunne ikke dekryptere]';
    }
  }

  async function init() {
    try {
      await ensureIdentity();
      const [usersRes, groupsRes] = await Promise.all([
        fetch('/users'),
        fetch('/groups')
      ]);
      const usersData = await safeJson(usersRes);
      const groupsData = await safeJson(groupsRes);
      const users = usersData.users || [];
      const groups = groupsData.groups || [];

      const app = document.getElementById('app');
      if (!app) throw new Error('Missing #app');

      app.innerHTML = `
        <header class="header">
          <div class="header-left">
            <h1 class="brand">CryptoChat</h1>
            <button id="logoutBtn" class="btn btn-small btn-ghost">Logg ut</button>
          </div>
          <div class="header-actions">
            <button id="themeBtn" class="btn btn-small btn-ghost">🌙 Tema</button>
            <button id="fa2Btn" class="btn btn-small btn-ghost">🔐 2FA</button>
          </div>
        </header>
        <div class="app-row">
          <aside class="sidebar">
            <div class="section">
              <div class="section-title">MELDINGER</div>
              <div id="usersList" class="list"></div>
            </div>
            <div class="section">
              <div class="section-title">GRUPPER</div>
              <div id="groupsList" class="list"></div>
              <button id="createGroupBtn" class="btn btn-small btn-ghost">+ Ny gruppe</button>
            </div>
          </aside>
          <main class="chat-main">
            <header class="chat-header">
              <div>
                <div id="chatTitle" class="chat-title">Velg en samtale</div>
                <div id="chatMeta" class="chat-meta"></div>
              </div>
              <div class="chat-actions">
                <input id="searchPartner" class="input-text" placeholder="Kontakt for søk" autocomplete="off" />
                <input id="searchInput" class="input-text" placeholder="Søk i meldinger..." autocomplete="off" />
                <button id="searchBtn" class="btn btn-small btn-ghost">Søk</button>
              </div>
            </header>
            <div id="messages" class="messages">
              <div class="empty-state">
                <div class="empty-icon">💬</div>
                <h3>Ingen samtale valgt</h3>
                <p>Velg en kontakt eller gruppe.</p>
              </div>
            </div>
            <div id="composer" class="composer" style="display:none">
              <input id="fileInput" type="file" class="input-text" />
              <div class="composer-row">
                <input id="messageInput" class="input-text" placeholder="Skriv en melding..." autocomplete="off" />
                <button id="sendBtn" class="btn btn-primary" disabled>Send</button>
              </div>
            </div>
          </main>
        </div>
      `;

      const usersList = document.getElementById('usersList');
      const groupsList = document.getElementById('groupsList');
      const chatTitle = document.getElementById('chatTitle');
      const chatMeta = document.getElementById('chatMeta');
      const chatE2EEStatus = document.createElement('span');
      chatE2EEStatus.className = 'e2ee-status';
      chatMeta.appendChild(chatE2EEStatus);

      const messagesBox = document.getElementById('messages');
      const composer = document.getElementById('composer');

      let activeChat = null;
      let interval = null;
      let userScrolledUp = false;

      let lastMessages = {};

      function renderUsers() {
        usersList.innerHTML = '';
        const list = Array.isArray(users) ? users : [];
        list.forEach(u => {
          const name = typeof u === 'string' ? u : (u && u.username) || JSON.stringify(u);
          const item = document.createElement('div');
          item.className = 'item';
          item.dataset.user = name;
          const preview = lastMessages[name] || '';
          item.innerHTML = '<div class="avatar-wrap"><div class="avatar">' + escapeHtml(name[0]) + '</div>' + (presence[name] ? '<div class="presence"></div>' : '') + '</div><div><div class="name">' + escapeHtml(name) + '</div><div class="preview">' + escapeHtml(preview) + '</div></div>';
          item.addEventListener('click', () => { activateItem(usersList, item); openChat(name); });
          usersList.appendChild(item);
        });
      }

      function renderGroups() {
        groupsList.innerHTML = '';
        groups.forEach(g => {
          const item = document.createElement('div');
          item.className = 'item';
          item.dataset.groupId = g.id;
          const preview = groupLastMessages[g.id] || '';
          item.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;"><div style="min-width:0;flex:1;"><div class="name">' + escapeHtml(g.name) + '</div><div class="preview">' + escapeHtml(preview || ((g.members || []).length + ' medlemmer')) + '</div></div><button class="btn btn-small btn-ghost delete-group" data-id="' + escapeHtml(g.id) + '">Slett</button></div>';
          item.addEventListener('click', (e) => { if (e.target.closest('.delete-group')) return; activateItem(groupsList, item); openGroup(g.id); });
          const del = item.querySelector('.delete-group');
          if (del) del.addEventListener('click', async () => { await deleteGroup(g.id); });
          groupsList.appendChild(item);
        });
      }

      async function deleteGroup(groupId) {
        const nameInput = prompt('Skriv inn gruppenavn for å bekrefte sletting:');
        if (!nameInput) return;
        const groups = await loadJSON('/groups');
        const group = (groups.groups || []).find(g => g.id === groupId);
        if (!group || group.name !== nameInput) return toast('Navnet matcher ikke');
        if (!confirm('Slett gruppen? Dette kan ikke angres.')) return;
        try {
          await fetch('/groups/' + encodeURIComponent(groupId), { method: 'DELETE' });
          toast('Gruppen er slettet', 'success');
          groups.length = 0; groups.push(...((await loadJSON('/groups')).groups || []));
          renderGroups();
        } catch (e) {
          toast('Kunne ikke slette gruppe');
        }
      }

      function activateItem(listContainer, item) {
        const siblings = listContainer.querySelectorAll('.item');
        siblings.forEach(el => el.classList.remove('active'));
        item.classList.add('active');
      }

      renderUsers();
      renderGroups();

      async function openChat(user) {
        activeChat = { type: 'user', target: user };
        chatTitle.textContent = user;
        chatMeta.textContent = '';
        messagesBox.innerHTML = '';
        composer.style.display = 'flex';
        activeChat.peerPublicKey = await getPeerPublicKeyPem(user);
        chatMeta.textContent = activeChat?.peerPublicKey ? '🔒 Ende-til-ende-kryptert' : '';
        await loadChat(user);
        const input = document.getElementById('messageInput');
        if (input) input.focus();
      }

      async function loadChat(user) {
        if (!user || activeChat?.type !== 'user' || activeChat?.target !== user) return;
        try {
          messagesBox.innerHTML = '<div class="empty-state"><div class="empty-icon">⏳</div><p>Laster...</p></div>';
          const data = await loadJSON('/messages/' + encodeURIComponent(user));
          messagesBox.innerHTML = '';
          const list = data.messages || [];
          if (!list.length) {
            messagesBox.innerHTML = '<div class="empty-state"><div class="empty-icon">💬</div><p>Ingen meldinger</p></div>';
          } else {
            list.forEach(m => appendMessage(m, user));
          }
          await loadJSON('/read_receipts/' + encodeURIComponent(user), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }).catch(() => {});
          if (list.length) lastMessages[user] = list[list.length - 1].text || '';
        } catch (e) {
          messagesBox.innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div><p>Kunne ikke hente meldinger</p></div>';
          toast('Kunne ikke hente meldinger');
        }
      }

      async function openGroup(groupId) {
        const group = groups.find(g => g.id === groupId);
        activeChat = { type: 'group', target: groupId };
        chatTitle.textContent = group ? group.name : 'Gruppe';
        chatMeta.textContent = '';
        chatE2EEStatus.textContent = '';
        messagesBox.innerHTML = '';
        composer.style.display = 'flex';
        if (group && (group.members || []).length) {
          let anyKey = false;
          for (const member of group.members) { if (await getPeerPublicKeyPem(member)) { anyKey = true; break; } }
          chatE2EEStatus.textContent = anyKey ? '🔒 Delvis E2EE i gruppe' : '';
        }
        await loadGroup(groupId);
        const input = document.getElementById('messageInput');
        if (input) input.focus();
      }

      let groupLastMessages = {};

      async function loadGroup(groupId) {
        if (!groupId || activeChat?.type !== 'group' || activeChat?.target !== groupId) return;
        try {
          messagesBox.innerHTML = '<div class="empty-state"><div class="empty-icon">⏳</div><p>Laster...</p></div>';
          const data = await loadJSON('/groups/' + encodeURIComponent(groupId) + '/messages');
          messagesBox.innerHTML = '';
          const list = data.messages || [];
          if (!list.length) {
            messagesBox.innerHTML = '<div class="empty-state"><div class="empty-icon">👥</div><p>Ingen gruppemeldinger</p></div>';
          } else {
            list.forEach(m => appendMessage(m, groupId));
            const last = list[list.length - 1];
            if (last) {
              let text = '';
              if (last.type === 'file') text = '📎 ' + (last.filename || 'fil');
              else text = (last.sender ? last.sender + ': ' : '') + (last.text || '');
              groupLastMessages[groupId] = text;
            }
          }
        } catch (e) {
          messagesBox.innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div><p>Kunne ikke hente gruppemeldinger</p></div>';
          toast('Kunne ikke hente gruppemeldinger');
        }
      }

      function appendMessage(message, chatId) {
        const isMe = message.sender === (window.__APP__?.username || '');
        const renderedText = (() => {
          if (!isMe && message.type === 'text' && activeChat?.type === 'user' && activeChat?.peerPublicKey) {
            const text = decryptFromPeer(message.text, activeChat.peerPublicKey);
            return text;
          }
          return message.text || '';
        })();
        const item = document.createElement('div');
        item.className = 'msg ' + (isMe ? 'sent' : 'received');
        const fileBadge = message.type === 'file'
          ? '<div class="badge">📎 ' + escapeHtml(message.filename || 'fil') + '</div>'
          : '';
        const e2eeIndicator = (!isMe && message.type === 'text' && activeChat?.type === 'user' && activeChat?.peerPublicKey)
          ? '<div class="meta"><span class="e2ee">🔒 E2EE</span></div>'
          : '';
        item.innerHTML = (
          '<div class="meta"><span class="sender">' + escapeHtml(message.sender || '') + '</span><span class="time">' + escapeHtml(formatTime(message.timestamp)) + '</span></div>'
          + fileBadge
          + '<div>' + escapeHtml(renderedText) + '</div>'
          + e2eeIndicator
          + '<div class="meta"><span class="read">' + (message.read === true ? 'Lest' : 'Ikke lest') + '</span></div>'
        );
        messagesBox.appendChild(item);
        if (!userScrolledUp) messagesBox.scrollTop = messagesBox.scrollHeight;
      }

      async function sendMessage() {
        const input = document.getElementById('messageInput');
        const fileInput = document.getElementById('fileInput');
        const sendBtn = document.getElementById('sendBtn');
        if (!input || !activeChat) return;
        input.disabled = true;
        sendBtn.disabled = true;
        const text = (input.value || '').trim();
        const file = fileInput && fileInput.files && fileInput.files[0];
        if (!text && !file) { input.disabled = false; return; }
        try {
          if (file) {
            const form = new FormData();
            form.append('file', file);
            if (activeChat.type === 'user') form.append('recipient', activeChat.target); else form.append('groupId', activeChat.target);
            await fetch('/upload', { method: 'POST', body: form });
          } else {
            const url = activeChat.type === 'group' ? '/groups/' + encodeURIComponent(activeChat.target) + '/send' : '/send';
            const body = { ciphertext: text };
            if (activeChat.type === 'user') {
              const ciphertext = await encryptForPeer(text, activeChat.peerPublicKey);
              body.ciphertext = ciphertext;
              body.recipient = activeChat.target;
            }
            await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
          }
          input.value = '';
          if (fileInput) fileInput.value = '';
          if (activeChat.type === 'user') await loadChat(activeChat.target); else await loadGroup(activeChat.target);
        } catch (e) {
          toast('Kunne ikke sende: ' + e.message);
        } finally {
          input.disabled = false;
          sendBtn.disabled = !((input.value || '').trim() || (fileInput && fileInput.files && fileInput.files[0]));
        }
      }

      function updateSendButton() {
        const input = document.getElementById('messageInput');
        const fileInput = document.getElementById('fileInput');
        const sendBtn = document.getElementById('sendBtn');
        if (!input || !sendBtn) return;
        const text = (input.value || '').trim();
        const file = fileInput && fileInput.files && fileInput.files[0];
        sendBtn.disabled = !(text || file);
      }

      if (messagesBox) {
        messagesBox.addEventListener('scroll', () => {
          const container = messagesBox;
          const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
          userScrolledUp = distanceFromBottom > 100;
        });
      }

      document.getElementById('sendBtn').addEventListener('click', sendMessage);
      document.getElementById('messageInput').addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
      });
      document.getElementById('messageInput').addEventListener('input', updateSendButton);
      document.getElementById('fileInput').addEventListener('change', updateSendButton);

      document.getElementById('searchBtn').addEventListener('click', async () => {
        const query = document.getElementById('searchInput').value.trim();
        const partner = document.getElementById('searchPartner').value.trim();
        if (!query || !partner) return toast('Søk trenger tekst og kontakt');
        try {
          const data = await loadJSON('/search?q=' + encodeURIComponent(query) + '&partner=' + encodeURIComponent(partner));
          messagesBox.innerHTML = '';
          const list = data.messages || [];
          if (!list.length) {
            messagesBox.innerHTML = '<div class="empty-state"><p>Ingen treff</p></div>';
          } else {
            list.forEach(m => appendMessage(m, partner));
          }
          toast(list.length + ' treff', 'success');
        } catch (e) {
          toast('Søk feilet');
        }
      });

      document.getElementById('themeBtn').addEventListener('click', async () => {
        const next = document.body.dataset.theme === 'light' ? 'dark' : 'light';
        document.body.dataset.theme = next;
        localStorage.setItem('theme', next);
        fetch('/theme', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ theme: next }) }).catch(() => {});
      });

      document.getElementById('createGroupBtn').addEventListener('click', async () => {
        const name = prompt('Gruppenavn:');
        if (!name) return;
        const members = (prompt('Medlemmer (komma-separert):', '') || '').split(',').map(x => x.trim()).filter(Boolean);
        try {
          await fetch('/groups', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, members }) });
          toast('Gruppe opprettet', 'success');
          const data = await loadJSON('/groups');
          renderGroups();
        } catch (e) {
          toast('Kunne ikke opprette gruppe');
        }
      });

      document.getElementById('fa2Btn').addEventListener('click', async () => {
        try {
          const data = await loadJSON('/auth/2fa/enable', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
          const wrap = document.createElement('div');
          wrap.innerHTML = '<img src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=' + encodeURIComponent(data.uri) + '" alt="2FA QR" /><div>' + escapeHtml(data.secret || '') + '</div>';
        } catch (e) {
          toast('2FA feilet');
        }
      });

      document.getElementById('logoutBtn').addEventListener('click', async () => {
        if (!confirm('Logge ut?')) return;
        await fetch('/auth/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }).catch(() => {});
        window.location.href = '/login';
      });

      interval = setInterval(() => {
        if (activeChat?.type === 'user') loadChat(activeChat.target);
        if (activeChat?.type === 'group') loadGroup(activeChat.target);
        loadJSON('/users').then(data => { users.length = 0; users.push(...data.users); renderUsers(); }).catch(() => {});
        loadJSON('/groups').then(data => { groups.length = 0; groups.push(...data.groups); renderGroups(); }).catch(() => {});
        updatePresence().catch(() => {});
      }, 2500);

      function updatePresence() {
        return loadJSON('/presence/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ users: Array.isArray(users) ? users.map(u => typeof u === 'string' ? u : (u && u.username) || '') : [] })
        }).then(data => {
          if (!data.presence) return;
          data.presence.forEach(entry => {
            const items = usersList.querySelectorAll('.item');
            items.forEach(item => {
              if (item.dataset.user === entry.username) {
                if (entry.online) item.classList.remove('offline'); else item.classList.add('offline');
              }
            });
          });
        });
      }

      document.body.setAttribute('data-theme', window.__APP__?.theme || 'dark');
    } catch (e) {
      document.getElementById('app').innerHTML = '<pre style="color:#ff8888;background:#0f1424;padding:16px;">' + escapeHtml(e.stack || e.message) + '</pre>';
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();