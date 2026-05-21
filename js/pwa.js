// PWA Module

let deferredPrompt = null;

document.addEventListener('DOMContentLoaded', () => {
  // Check if already installed
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return; // Already running as PWA
  }

  // Check if dismissed in this session
  if (sessionStorage.getItem('pwa_dismissed')) {
    return;
  }

  // Listen for install prompt
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showPwaPrompt();
  });

  // Show prompt after delay if no beforeinstallprompt event
  setTimeout(() => {
    if (!deferredPrompt && !sessionStorage.getItem('pwa_dismissed')) {
      showPwaPrompt();
    }
  }, 3000);

  // Install button
  const installBtn = document.getElementById('pwaInstall');
  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          showToast('ViksitOS installed!', 'success');
        }
        deferredPrompt = null;
      }
      hidePwaPrompt();
    });
  }

  // Dismiss button
  const dismissBtn = document.getElementById('pwaDismiss');
  if (dismissBtn) {
    dismissBtn.addEventListener('click', () => {
      hidePwaPrompt();
    });
  }

  // Close button
  const closeBtn = document.getElementById('pwaClose');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      hidePwaPrompt();
    });
  }
});

function showPwaPrompt() {
  const prompt = document.getElementById('pwaPrompt');
  if (prompt) {
    prompt.classList.add('active');
  }
}

function hidePwaPrompt() {
  const prompt = document.getElementById('pwaPrompt');
  if (prompt) {
    prompt.classList.remove('active');
  }
  sessionStorage.setItem('pwa_dismissed', 'true');
}

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('Service Worker registered'))
      .catch(err => console.log('Service Worker registration failed:', err));
  });
}
