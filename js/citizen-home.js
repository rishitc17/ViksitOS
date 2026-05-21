// Citizen Home Screen

let userProfile = null;

document.addEventListener('DOMContentLoaded', async () => {
  if (!initSupabase()) {
    window.location.href = 'login.html';
    return;
  }

  userProfile = await requireAuth('citizen');
  if (!userProfile) return;

  // Set user info
  document.getElementById('userName').textContent = userProfile.full_name;
  document.getElementById('userAvatar').textContent = userProfile.first_name.charAt(0).toUpperCase();
  document.getElementById('welcomeText').textContent = `Welcome, ${userProfile.first_name}!`;

  // Load notifications
  await loadNotifications();

  // Theme toggle
  initTheme();

  // User menu dropdown
  initUserMenu();

  // App search
  initAppSearch();

  // Notification panel
  initNotifPanel();
});

function initTheme() {
  const savedTheme = localStorage.getItem('viksitos_theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  document.getElementById('themeToggle').addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('viksitos_theme', next);
    updateThemeIcon(next);
  });
}

function updateThemeIcon(theme) {
  const icon = document.querySelector('#themeToggle i');
  icon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
}

function initUserMenu() {
  const userMenu = document.getElementById('userMenu');
  const dropdown = document.getElementById('dropdownMenu');

  userMenu.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('active');
  });

  document.addEventListener('click', () => {
    dropdown.classList.remove('active');
  });

  document.getElementById('dropdownLogout').addEventListener('click', () => {
    logout();
  });
}

function initAppSearch() {
  const searchInput = document.getElementById('appSearch');
  const appItems = document.querySelectorAll('.app-item');

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    
    appItems.forEach(item => {
      const name = item.querySelector('.app-name').textContent.toLowerCase();
      item.classList.toggle('hidden', !name.includes(query));
    });
  });
}

function initNotifPanel() {
  const notifBtn = document.getElementById('notifBtn');
  const notifPanel = document.getElementById('notifPanel');
  const notifOverlay = document.getElementById('notifOverlay');
  const markAllRead = document.getElementById('markAllRead');

  notifBtn.addEventListener('click', () => {
    notifPanel.classList.add('active');
    notifOverlay.classList.add('active');
  });

  const closePanel = () => {
    notifPanel.classList.remove('active');
    notifOverlay.classList.remove('active');
  };

  notifOverlay.addEventListener('click', closePanel);

  markAllRead.addEventListener('click', async () => {
    await markAllNotificationsRead();
    closePanel();
  });
}

// Open app in full screen view
function openApp(appName) {
  const appView = document.getElementById('appView');
  const appViewTitle = document.getElementById('appViewTitle');
  const appViewContent = document.getElementById('appViewContent');

  const appConfig = {
    apply: { title: 'Apply Services', init: initApplyServices },
    applications: { title: 'My Applications', init: initMyApplications },
    documents: { title: 'Documents', init: initDocuments }
  };

  const config = appConfig[appName];
  if (!config) return;

  appViewTitle.textContent = config.title;
  appViewContent.innerHTML = '<div class="loading-container"><div class="spinner"></div><p>Loading...</p></div>';
  appView.classList.add('active');

  config.init(appViewContent);
}

// Close app view
document.addEventListener('DOMContentLoaded', () => {
  const appBackBtn = document.getElementById('appBackBtn');
  if (appBackBtn) {
    appBackBtn.addEventListener('click', () => {
      document.getElementById('appView').classList.remove('active');
    });
  }
});

// Format date
function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', { 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatRelativeTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(dateStr);
}
