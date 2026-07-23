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
      ['Brukere', s.total_users], ['Meldinger', s.total_messages], ['Grupper', s.total_groups], ['Aktive økter', s.active_sessions], ['Admins', s.admin_users]
    ].map(([l,v]) => '<div class="stat-card"><div class="stat-value">'+escape(v)+'</div><div class="stat-label">'+escape(l)+'</div></div>').join('');
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
    document.getElementById(id).classList.add('active');
    document.querySelector('[data-section="'+id+'"]').classList.add('active');
    if (id === 'users') loadUsers();
    if (id === 'messages') loadMessages();
  }

  function showToast(msg) {
    const t = document.createElement('div');
    t.textContent = msg;
    t.style.cssText = 'position:fixed;top:16px;left:50%;transform:translateX(-50%);background:#1a1c30;color:#d8d8fd;padding:12px 20px;border-radius:10px;z-index:9999;font-size:.9rem;border:1px solid #2a2d48;';
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2500);
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
