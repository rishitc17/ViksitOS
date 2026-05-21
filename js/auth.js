// ViksitOS Authentication Module

window.ViksitOS = window.ViksitOS || {};
window.ViksitOS.auth = (function() {
  var supabase = null;
  var currentUser = null;
  var currentRole = 'citizen';
  var authMode = 'signin';

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
    var result = await supabase.auth.getSession();
    var session = result.data.session;
    if (session) {
      currentUser = session.user;
      var profileResult = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();
      if (profileResult.data) return profileResult.data;
    }
    return null;
  }

  async function signIn(email, password) {
    if (!supabase) {
      showToast('Supabase not configured', 'error');
      return false;
    }
    var result = await supabase.auth.signInWithPassword({ email: email, password: password });
    if (result.error) {
      showToast(result.error.message, 'error');
      return false;
    }
    return true;
  }

  async function signUp(email, password, fullName, role, department) {
    if (!supabase) {
      showToast('Supabase not configured', 'error');
      return false;
    }
    var result = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: { full_name: fullName, role: role, department: department },
        emailRedirectTo: window.location.origin + '/ViksitOS/pages/citizen.html'
      }
    });
    if (result.error) {
      showToast(result.error.message, 'error');
      return false;
    }
    if (result.data.user && !result.data.session) {
      showToast('Account created! Please check your email to verify, then sign in.', 'success');
      return 'verify';
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
    var stored = localStorage.getItem('viksitos_user');
    if (stored) return JSON.parse(stored);
    var profile = await checkAuth();
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
    var profile = await getProfile();
    if (!profile) {
      window.location.href = '/ViksitOS/pages/login.html';
      return null;
    }
    if (requiredRole && profile.role !== requiredRole) {
      showToast('Access denied', 'error');
      window.location.href = profile.role === 'government' ? '/ViksitOS/pages/government.html' : '/ViksitOS/pages/citizen.html';
      return null;
    }
    return profile;
  }

  async function handleAuthCallback() {
    if (!supabase) return null;
    var result = await supabase.auth.getSession();
    var session = result.data.session;
    var error = result.error;
    if (error || !session) return null;
    currentUser = session.user;
    var profileResult = await supabase
      .from('profiles')
      .select('*')
      .eq('id', currentUser.id)
      .single();
    var profile = profileResult.data;
    if (!profile) {
      var fullName = currentUser.user_metadata && currentUser.user_metadata.full_name ? currentUser.user_metadata.full_name : 'User';
      var firstName = fullName.split(' ')[0];
      var role = currentUser.user_metadata && currentUser.user_metadata.role ? currentUser.user_metadata.role : 'citizen';
      var dept = currentUser.user_metadata ? currentUser.user_metadata.department : null;
      var insertResult = await supabase
        .from('profiles')
        .insert([{
          id: currentUser.id,
          email: currentUser.email,
          full_name: fullName,
          first_name: firstName,
          role: role,
          department: dept
        }])
        .select()
        .single();
      if (insertResult.error) {
        console.error('Profile creation error:', insertResult.error);
        profile = {
          id: currentUser.id,
          email: currentUser.email,
          full_name: fullName,
          first_name: firstName,
          role: role,
          department: dept
        };
      } else {
        profile = insertResult.data;
      }
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
    var container = document.getElementById('toastContainer');
    if (!container) return;
    var toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    var icons = {
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

      var authTabs = document.querySelectorAll('.auth-tab');
      authTabs.forEach(function(btn) {
        btn.addEventListener('click', function() {
          authTabs.forEach(function(b) { b.classList.remove('active'); });
          btn.classList.add('active');
          authMode = btn.dataset.mode;

          var signupFields = document.querySelectorAll('.signup-only');
          signupFields.forEach(function(el) {
            el.classList.toggle('hidden', authMode !== 'signup');
          });

          var submitBtn = document.getElementById('submitBtn');
          var authInfoText = document.getElementById('authInfoText');
          if (authMode === 'signup') {
            submitBtn.innerHTML = '<i class="fa-solid fa-user-plus"></i><span>Sign Up</span>';
            authInfoText.textContent = 'Create a new account to get started';
          } else {
            submitBtn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i><span>Sign In</span>';
            authInfoText.textContent = 'Sign in to access your account';
          }
        });
      });

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
        var password = document.getElementById('password').value;
        var fullName = document.getElementById('fullName') ? document.getElementById('fullName').value.trim() : '';
        var department = document.getElementById('department') ? document.getElementById('department').value : null;
        var submitBtn = document.getElementById('submitBtn');

        if (!email || !password) {
          showToast('Please fill in email and password', 'error');
          return;
        }

        if (authMode === 'signup' && !fullName) {
          showToast('Please enter your full name', 'error');
          return;
        }

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<div class="spinner" style="width:20px;height:20px;border-width:2px;"></div> Please wait...';

        if (authMode === 'signup') {
          signUp(email, password, fullName, currentRole, department).then(function(result) {
            if (result === true) {
              showToast('Account created! Redirecting...', 'success');
              setTimeout(function() {
                handleAuthCallback();
              }, 1000);
            } else if (result === 'verify') {
              submitBtn.disabled = false;
              submitBtn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i><span>Sign In</span>';
              authMode = 'signin';
              authTabs.forEach(function(b) { b.classList.remove('active'); });
              authTabs[0].classList.add('active');
              document.querySelectorAll('.signup-only').forEach(function(el) { el.classList.add('hidden'); });
              document.getElementById('authInfoText').textContent = 'Sign in to access your account';
              var submitBtn2 = document.getElementById('submitBtn');
              submitBtn2.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i><span>Sign In</span>';
            } else {
              submitBtn.disabled = false;
              submitBtn.innerHTML = '<i class="fa-solid fa-user-plus"></i><span>Sign Up</span>';
            }
          });
        } else {
          signIn(email, password).then(function(success) {
            if (success) {
              showToast('Signed in successfully!', 'success');
              setTimeout(function() {
                handleAuthCallback();
              }, 500);
            } else {
              submitBtn.disabled = false;
              submitBtn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i><span>Sign In</span>';
            }
          });
        }
      });
    });
  }

  function getSupabase() { return supabase; }
  function getCurrentUser() { return currentUser; }
  function getCurrentRole() { return currentRole; }
  function setCurrentRole(role) { currentRole = role; }

  return {
    initSupabase: initSupabase,
    signIn: signIn,
    signUp: signUp,
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

document.addEventListener('DOMContentLoaded', function() {
  window.ViksitOS.auth.initLoginPage();
});

window.showToast = function(msg, type, dur) { window.ViksitOS.auth.showToast(msg, type, dur); };
window.logout = function() { window.ViksitOS.auth.logout(); };
window.requireAuth = function(role) { return window.ViksitOS.auth.requireAuth(role); };
window.getProfile = function() { return window.ViksitOS.auth.getProfile(); };
window.initSupabase = function() { return window.ViksitOS.auth.initSupabase(); };
