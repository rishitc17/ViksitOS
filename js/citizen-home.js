// Citizen Home Screen

var userProfile = null;

document.addEventListener('DOMContentLoaded', async function() {
  if (!window.ViksitOS.auth.initSupabase()) {
    window.location.href = '/ViksitOS/pages/login.html';
    return;
  }

  userProfile = await window.ViksitOS.auth.requireAuth('citizen');
  if (!userProfile) return;

  document.getElementById('userName').textContent = userProfile.full_name;
  document.getElementById('userAvatar').textContent = userProfile.first_name.charAt(0).toUpperCase();
  document.getElementById('welcomeText').textContent = 'Welcome, ' + userProfile.first_name + '!';

  await loadNotifications();
  initTheme();
  initUserMenu();
  initAppSearch();
  initNotifPanel();
});

function initTheme() {
  var savedTheme = localStorage.getItem('viksitos_theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  document.getElementById('themeToggle').addEventListener('click', function() {
    var current = document.documentElement.getAttribute('data-theme');
    var next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('viksitos_theme', next);
    updateThemeIcon(next);
  });
}

function updateThemeIcon(theme) {
  var icon = document.querySelector('#themeToggle i');
  icon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
}

function initUserMenu() {
  var userMenu = document.getElementById('userMenu');
  var dropdown = document.getElementById('dropdownMenu');

  userMenu.addEventListener('click', function(e) {
    e.stopPropagation();
    dropdown.classList.toggle('active');
  });

  document.addEventListener('click', function() {
    dropdown.classList.remove('active');
  });

  document.getElementById('dropdownLogout').addEventListener('click', function() {
    logout();
  });
}

function initAppSearch() {
  var searchInput = document.getElementById('appSearch');
  var appItems = document.querySelectorAll('.app-item');

  searchInput.addEventListener('input', function(e) {
    var query = e.target.value.toLowerCase();
    appItems.forEach(function(item) {
      var name = item.querySelector('.app-name').textContent.toLowerCase();
      item.classList.toggle('hidden', !name.includes(query));
    });
  });
}

function initNotifPanel() {
  var notifBtn = document.getElementById('notifBtn');
  var notifPanel = document.getElementById('notifPanel');
  var notifOverlay = document.getElementById('notifOverlay');
  var markAllRead = document.getElementById('markAllRead');

  notifBtn.addEventListener('click', function() {
    notifPanel.classList.add('active');
    notifOverlay.classList.add('active');
  });

  function closePanel() {
    notifPanel.classList.remove('active');
    notifOverlay.classList.remove('active');
  }

  notifOverlay.addEventListener('click', closePanel);

  markAllRead.addEventListener('click', async function() {
    await markAllNotificationsRead();
    closePanel();
  });
}

function openApp(appName) {
  var appView = document.getElementById('appView');
  var appViewTitle = document.getElementById('appViewTitle');
  var appViewContent = document.getElementById('appViewContent');

  var appConfig = {
    apply: { title: 'Apply Services', init: initApplyServices },
    applications: { title: 'My Applications', init: initMyApplications },
    documents: { title: 'Documents', init: initDocuments }
  };

  var config = appConfig[appName];
  if (!config) return;

  appViewTitle.textContent = config.title;
  appViewContent.innerHTML = '<div class="loading-container"><div class="spinner"></div><p>Loading...</p></div>';
  appView.classList.add('active');

  config.init(appViewContent);
}

document.addEventListener('DOMContentLoaded', function() {
  var appBackBtn = document.getElementById('appBackBtn');
  if (appBackBtn) {
    appBackBtn.addEventListener('click', function() {
      document.getElementById('appView').classList.remove('active');
    });
  }
});

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  var date = new Date(dateStr);
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
  var date = new Date(dateStr);
  var now = new Date();
  var diff = now - date;
  var minutes = Math.floor(diff / 60000);
  var hours = Math.floor(diff / 3600000);
  var days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return minutes + 'm ago';
  if (hours < 24) return hours + 'h ago';
  if (days < 7) return days + 'd ago';
  return formatDate(dateStr);
}
