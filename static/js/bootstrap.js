(() => {
  const body = document.body;
  const ds = body.dataset;
  if (ds.username) sessionStorage.removeItem('auth-redirecting');
  window.__APP__ = {
    username: ds.username || '',
    partnerKeys: (() => { try { return localStorage.getItem('partnerKeys') ? JSON.parse(localStorage.getItem('partnerKeys')) : {}; } catch(e) { return {}; } })(),
    theme: localStorage.getItem('theme') || 'dark',
    turnUrl: '',
    turnUser: '',
    turnPass: ''
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
    const labelEl = document.getElementById('installBannerLabel');
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = window.navigator.standalone === true || (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
    if (isIOS && !isStandalone && !localStorage.getItem('installDismissed') && labelEl) {
      labelEl.textContent = 'Legg til på startsiden';
      acceptBtn.textContent = 'Hvordan?';
    }
    if (acceptBtn) acceptBtn.addEventListener('click', () => {
      if (deferredPrompt) { deferredPrompt.prompt(); deferredPrompt.userChoice.then(() => { deferredPrompt = null; }).catch(() => {}); }
      const banner = document.getElementById('installBanner');
      if (banner) banner.classList.remove('install-banner-visible');
      if (isIOS && !isStandalone && !localStorage.getItem('installDismissed')) {
        const msg = document.getElementById('installBannerLabel');
        if (msg) msg.textContent = 'Trykk Del-ikonet (⤴) nederst i Safari → "Legg til på startsiden"';
      }
    });
    if (dismissBtn) dismissBtn.addEventListener('click', () => {
      localStorage.setItem('installDismissed', '1');
      const banner = document.getElementById('installBanner');
      if (banner) banner.classList.remove('install-banner-visible');
    });
  });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).then(() => {
      setupPushSubscription();
    }).catch(() => {});
  }

  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
    return outputArray;
  }

  async function setupPushSubscription() {
    try {
      if (!('PushManager' in window)) return;
      if (!window.__APP__.username) return;
      const reg = await navigator.serviceWorker.ready;
      const res = await fetch('/push/vapid-key');
      const data = await res.json();
      if (!data.key) return;
      let sub = await reg.pushManager.getSubscription();
      const knownKey = localStorage.getItem('vapidKey') || '';
      if (sub && knownKey && knownKey !== data.key) {
        await sub.unsubscribe();
        sub = null;
      }
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(data.key),
        });
        localStorage.setItem('vapidKey', data.key);
      }
      await fetch('/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub.toJSON() }),
      });
    } catch (e) {
      window.__pushError = e;
    }
  }
})();
