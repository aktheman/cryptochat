(() => {
  const body = document.body;
  const ds = body.dataset;
  window.__APP__ = {
    username: ds.username || '',
    partnerKeys: localStorage.getItem('partnerKeys') ? JSON.parse(localStorage.getItem('partnerKeys')) : {},
    theme: localStorage.getItem('theme') || 'dark',
    turnUrl: ds.turnUrl || '',
    turnUser: ds.turnUser || ''
  };

  let deferredPrompt;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (!localStorage.getItem('installDismissed')) {
      const banner = document.getElementById('installBanner');
      if (banner) banner.classList.add('install-banner-visible');
    }
  });
  document.addEventListener('DOMContentLoaded', () => {
    const acceptBtn = document.getElementById('installAcceptBtn');
    const dismissBtn = document.getElementById('installDismissBtn');
    if (acceptBtn) acceptBtn.addEventListener('click', () => {
      if (deferredPrompt) { deferredPrompt.prompt(); deferredPrompt.userChoice.then(() => { deferredPrompt = null; }); }
      document.getElementById('installBanner').classList.remove('install-banner-visible');
    });
    if (dismissBtn) dismissBtn.addEventListener('click', () => {
      localStorage.setItem('installDismissed', '1');
      document.getElementById('installBanner').classList.remove('install-banner-visible');
    });
  });
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(r => r.forEach(x => x.unregister()));
  }
})();
