(() => {
  'use strict';

  let currentAdmin = '';

  async function api(path, opts) {
    try {
      const r = await fetch(path, opts);
      if (!r.ok) return { success: false, message: 'Feil ' + r.status };
      return await r.json();
    } catch (e) { return { success: false, message: 'Nettverksfeil' }; }
  }

  async function loadStats() {
    const d = await api('/admin/stats');
    if (!d.success) { document.getElementById('stats').innerHTML = '<p>Ingen tilgang. <a href="/login">Logg inn som admin</a></p>'; return; }
    currentAdmin = d.stats.current_admin || '';
    const s = d.stats;
    document.getElementById('stats').innerHTML = [
      ['Brukere', s.total_users], ['Meldinger', s.total_messages], ['Grupper', s.total_groups], ['Aktive økter', s.active_sessions], ['Admins', s.admin_users],
      ['Sist 24 t', s.messages_last_24h], ['Filer', s.file_messages], ['E2EE', s.e2ee_messages]
    ].map(([l,v]) => '<div class="stat-card"><div class="stat-value">'+escape(v)+'</div><div class="stat-label">'+escape(l)+'</div></div>').join('');
    renderInsights(s);
  }

  function renderInsights(s) {
    const topSenders = document.getElementById('topSendersTable');
    if (topSenders) {
      const rows = (s.top_senders || []).map(x =>
        '<tr><td>'+escape(x.username)+'</td><td>'+escape(x.count)+'</td></tr>'
      ).join('');
      topSenders.innerHTML = rows || '<tr><td colspan="2">Ingen data ennå</td></tr>';
    }
    const perDay = document.getElementById('perDayChart');
    if (perDay) {
      const days = (s.messages_per_day || []);
      const maxDay = Math.max(1, ...days.map(d => d.count));
      perDay.innerHTML = '<div class="insights-bars-row">' + days.map(d =>
        '<div class="insights-bar-col" title="'+escape(d.date)+': '+escape(d.count)+'">' +
        '<div class="insights-bar" style="height:'+Math.max(2, Math.round((d.count/maxDay)*100))+'%"></div>' +
        '<span class="insights-bar-label">'+escape((d.date||'').slice(5))+'</span></div>'
      ).join('') + '</div>';
    }
    const perHour = document.getElementById('perHourChart');
    if (perHour) {
      const hours = s.messages_per_hour || [];
      const maxHour = Math.max(1, ...hours);
      perHour.innerHTML = '<div class="insights-bars-row">' + hours.map((c, h) =>
        '<div class="insights-bar-col" title="'+h+':00 → '+escape(c)+'">' +
        '<div class="insights-bar" style="height:'+Math.max(2, Math.round((c/maxHour)*100))+'%"></div>' +
        '<span class="insights-bar-label">'+escape(h)+'</span></div>'
      ).join('') + '</div>';
    }
  }

  async function loadUsers() {
    const d = await api('/admin/users');
    if (!d.success) return;
    document.getElementById('usersTable').innerHTML = d.users.map(u =>
      '<tr><td>'+escape(u.username)+'</td><td>'+escape(u.display_name||u.username)+'</td><td>'+(u.is_admin?'<span class="admin-badge-tag">Admin</span>':'')+'</td><td>'+(u.twofa_enabled?'✅':'—')+'</td><td>'+((u.created_at||'').split('T')[0]||'')+'</td><td class="actions"><button class="btn btn-ghost" data-action="toggle-admin" data-user="'+escape(u.username)+'">'+(u.is_admin?'Fjern admin':'Gjør til admin')+'</button><button class="btn btn-warning" data-action="ban" data-user="'+escape(u.username)+'">Utesteng</button><button class="btn btn-danger" data-action="delete" data-user="'+escape(u.username)+'">Slett</button></td></tr>'
    ).join('');
  }

  async function loadMessages() {
    const d = await api('/admin/messages?limit=100');
    if (!d.success) return;
    document.getElementById('msgsTable').innerHTML = d.messages.map(m =>
      '<tr><td>'+escape(m.sender)+'</td><td>'+escape(m.recipient||m.group_id||'')+'</td><td>'+escape(m.type)+'</td><td>'+((m.timestamp||'').split('T')[0]||'')+'</td></tr>'
    ).join('');
  }

  function showSection(id) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    const section = document.getElementById(id);
    if (section) section.classList.add('active');
    const tab = document.querySelector('[data-section="'+id+'"]');
    if (tab) tab.classList.add('active');
    if (id === 'users') loadUsers();
    if (id === 'messages') loadMessages();
    if (id === 'insights') loadStats();
  }

  function showToast(msg) {
    const t = document.createElement('div');
    t.className = 'toast-notification';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3000);
  }

  async function toggleAdmin(u) {
    const d = await api('/admin/users/'+encodeURIComponent(u)+'/toggle-admin', {method:'POST'});
    showToast(d.message || (d.success ? 'Oppdatert' : 'Feil'));
    loadUsers(); loadStats();
  }

  async function banUser(u) {
    if (u === currentAdmin) return showToast('Du kan ikke utestenge deg selv');
    if (!confirm('Utestenge '+u+'?')) return;
    const d = await api('/admin/users/'+encodeURIComponent(u)+'/ban', {method:'POST'});
    showToast(d.message || (d.success ? 'Utestengt' : 'Feil'));
    loadUsers();
  }

  async function deleteUser(u) {
    if (u === currentAdmin) return showToast('Du kan ikke slette deg selv');
    if (!confirm('Slette '+u+'? Dette kan ikke angres.')) return;
    const d = await api('/admin/users/'+encodeURIComponent(u)+'/delete', {method:'POST'});
    showToast(d.message || (d.success ? 'Slettet' : 'Feil'));
    loadUsers(); loadStats();
  }

  function escape(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }

  document.addEventListener('click', (e) => {
    const tab = e.target.closest('[data-section]');
    if (tab) showSection(tab.getAttribute('data-section'));

    const actionBtn = e.target.closest('[data-action]');
    if (actionBtn) {
      const u = actionBtn.dataset.user;
      const a = actionBtn.dataset.action;
      if (a === 'toggle-admin') toggleAdmin(u);
      else if (a === 'ban') banUser(u);
      else if (a === 'delete') deleteUser(u);
    }
  });

  loadStats(); loadUsers();
})();
