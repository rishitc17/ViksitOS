// ViksitOS Authentication Module

window.ViksitOS = window.ViksitOS || {};
window.ViksitOS.auth = (function() {
  let supabase = null;
  let currentUser = null;
  let currentRole = 'citizen';

  function initSupabase() {
    if (SUPABASE_CONFIG.url === 'YOUR_SUPABASE_URL') {
      console.warn('Please configure Supabase credentials in js/config.js');
      return false;
    }
    supabase = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    window.ViksitOS.supabase = supabase;
    return true;
  }

  async function checkAuth() {
    if (!supabase) return null;
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      currentUser = session.user;
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();
      if (profile) return profile;
    }
    return null;
  }

  async function loginWithEmail(email, fullName, role, department) {
    if (!supabase) {
      window.ViksitOS.auth.showToast('Supabase not configured', 'error');
      return false;
    }
    const { error } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        data: { full_name: fullName, role: role, department: department },
        emailRedirectTo: window.location.origin + '/ViksitOS/pages/citizen.html'
      }
    });
    if (error) {
      window.ViksitOS.auth.showToast(error.message, 'error');
      return false;
    }
    return true;
  }

  async function logout() {
    if (supabase) await supabase.auth.signOut();
    localStorage.removeItem('viksitos_user');
    localStorage.removeItem('viksitos_session');
    window.location.href = '/ViksitOS/pages/login.html';
  }

  async function getProfile() {
    const stored = localStorage.getItem('viksitos_user');
    if (stored) return JSON.parse(stored);
    const profile = await checkAuth();
    if (profile) {
      localStorage.setItem('viksitos_user', JSON.stringify(profile));
      return profile;
    }
    return null;
  }

  async function requireAuth(requiredRole) {
    if (!initSupabase()) {
      window.location.href = '/ViksitOS/pages/login.html';
      return null;
    }
    const profile = await getProfile();
    if (!profile) {
      window.location.href = '/ViksitOS/pages/login.html';
      return null;
    }
    if (requiredRole && profile.role !== requiredRole) {
      window.ViksitOS.auth.showToast('Access denied', 'error');
      window.location.href = profile.role === 'government' ? '/ViksitOS/pages/government.html' : '/ViksitOS/pages/citizen.html';
      return null;
    }
    return profile;
  }

  async function handleAuthCallback() {
    if (!supabase) return null;
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) return null;
    currentUser = session.user;
    let { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', currentUser.id)
      .single();
    if (!profile) {
      const { data: newProfile, error: profileError } = await supabase
        .from('profiles')
        .insert([{
          id: currentUser.id,
          email: currentUser.email,
          full_name: currentUser.user_metadata?.full_name || 'User',
          first_name: (currentUser.user_metadata?.full_name || 'User').split(' ')[0],
          role: currentUser.user_metadata?.role || 'citizen',
          department: currentUser.user_metadata?.department || null
        }])
        .select()
        .single();
      if (profileError) {
        console.error('Profile creation error:', profileError);
        return null;
      }
      profile = newProfile;
    }
    localStorage.setItem('viksitos_user', JSON.stringify(profile));
    if (profile.role === 'government') {
      window.location.href = '/ViksitOS/pages/government.html';
    } else {
      window.location.href = '/ViksitOS/pages/citizen.html';
    }
    return profile;
  }

  function showToast(message, type, duration) {
    type = type || 'info';
    duration = duration || 5000;
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    const icons = {
      success: 'fa-circle-check',
      error: 'fa-circle-xmark',
      info: 'fa-circle-info',
      warning: 'fa-triangle-exclamation'
    };
    toast.innerHTML = '<i class="fa-solid ' + (icons[type] || icons.info) + '"></i><span>' + message + '</span>';
    container.appendChild(toast);
    setTimeout(function() { toast.remove(); }, duration);
  }

  function initLoginPage() {
    var loginForm = document.getElementById('loginForm');
    if (!loginForm) return;

    initSupabase();

    var hash = window.location.hash;
    if (hash.includes('access_token') || hash.includes('type=recovery')) {
      handleAuthCallback();
      return;
    }

    getProfile().then(function(profile) {
      if (profile) {
        window.location.href = profile.role === 'government' ? '/ViksitOS/pages/government.html' : '/ViksitOS/pages/citizen.html';
        return;
      }

      var tabBtns = document.querySelectorAll('.tab-btn');
      tabBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
          tabBtns.forEach(function(b) { b.classList.remove('active'); });
          btn.classList.add('active');
          currentRole = btn.dataset.role;
          var govFields = document.querySelectorAll('.government-only');
          govFields.forEach(function(el) {
            el.classList.toggle('hidden', currentRole !== 'government');
          });
        });
      });

      loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        var email = document.getElementById('email').value.trim();
        var fullName = document.getElementById('fullName').value.trim();
        var department = document.getElementById('department') ? document.getElementById('department').value : null;
        var submitBtn = document.getElementById('submitBtn');

        if (!email || !fullName) {
          showToast('Please fill in all fields', 'error');
          return;
        }

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<div class="spinner" style="width:20px;height:20px;border-width:2px;"></div> Sending...';

        loginWithEmail(email, fullName, currentRole, department).then(function(success) {
          if (success) {
            loginForm.classList.add('hidden');
            document.querySelector('.login-tabs').classList.add('hidden');
            document.getElementById('successMessage').classList.remove('hidden');
          } else {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i><span>Send Magic Link</span>';
          }
        });
      });
    });
  }

  function getSupabase() { return supabase; }
  function getCurrentUser() { return currentUser; }
  function getCurrentRole() { return currentRole; }
  function setCurrentRole(role) { currentRole = role; }

  return {
    initSupabase: initSupabase,
    loginWithEmail: loginWithEmail,
    logout: logout,
    getProfile: getProfile,
    requireAuth: requireAuth,
    handleAuthCallback: handleAuthCallback,
    showToast: showToast,
    initLoginPage: initLoginPage,
    getSupabase: getSupabase,
    getCurrentUser: getCurrentUser,
    getCurrentRole: getCurrentRole,
    setCurrentRole: setCurrentRole
  };
})();

// Auto-init login page when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  window.ViksitOS.auth.initLoginPage();
});

// Expose commonly used functions globally for other modules
window.ViksitOS = window.ViksitOS || {};
window.showToast = function(msg, type, dur) { window.ViksitOS.auth.showToast(msg, type, dur); };
window.logout = function() { window.ViksitOS.auth.logout(); };
window.requireAuth = function(role) { return window.ViksitOS.auth.requireAuth(role); };
window.getProfile = function() { return window.ViksitOS.auth.getProfile(); };
window.initSupabase = function() { return window.ViksitOS.auth.initSupabase(); };
