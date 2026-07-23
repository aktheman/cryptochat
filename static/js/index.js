document.addEventListener('click', (e) => {
  const tabBtn = e.target.closest('[data-tab]');
  if (tabBtn) {
    const tab = tabBtn.getAttribute('data-tab');
    document.getElementById('loginForm').style.display = tab === 'login' ? 'block' : 'none';
    document.getElementById('registerForm').style.display = tab === 'register' ? 'block' : 'none';
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    tabBtn.classList.add('active');
  }
});

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    const msg = document.getElementById('authMessage');

    msg.textContent = 'Logger inn...';
    msg.className = 'message-box loading';

    const res = await fetch('/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({username, password})
    });
    const data = await res.json();

    if (data.success) {
        msg.textContent = 'Logget inn!';
        msg.className = 'message-box success';
        setTimeout(() => window.location.href = '/', 500);
    } else {
        msg.textContent = data.message || 'Feil ved innlogging.';
        msg.className = 'message-box error';
    }
});

document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;
    const msg = document.getElementById('authMessage');

    msg.textContent = 'Registrerer...';
    msg.className = 'message-box loading';

    const res = await fetch('/register', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({username, password})
    });
    const data = await res.json();

    if (data.success) {
        msg.textContent = 'Registrert! Omdirigerer...';
        msg.className = 'message-box success';
        setTimeout(() => window.location.href = '/', 500);
    } else {
        msg.textContent = data.message || 'Registrering feilet.';
        msg.className = 'message-box error';
    }
});
