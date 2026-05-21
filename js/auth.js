// ViksitOS Authentication Module

let supabase;
let currentUser = null;
let currentRole = 'citizen';

// Initialize Supabase
function initSupabase() {
  if (SUPABASE_CONFIG.url === 'YOUR_SUPABASE_URL') {
    console.warn('Please configure Supabase credentials in js/config.js');
    return false;
  }
  supabase = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
  return true;
}

// Check if user is already logged in
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
    
    if (profile) {
      return profile;
    }
  }
  return null;
}

// Login with magic link
async function loginWithEmail(email, fullName, role, department = null) {
  if (!supabase) {
    showToast('Supabase not configured', 'error');
    return false;
  }

  const { error } = await supabase.auth.signInWithOtp({
    email: email,
    options: {
      data: {
        full_name: fullName,
        role: role,
        department: department
      },
      emailRedirectTo: window.location.origin + '/pages/citizen.html'
    }
  });

  if (error) {
    showToast(error.message, 'error');
    return false;
  }

  return true;
}

// Logout
async function logout() {
  if (supabase) {
    await supabase.auth.signOut();
  }
  localStorage.removeItem('viksitos_user');
  localStorage.removeItem('viksitos_session');
  window.location.href = 'login.html';
}

// Get current user profile
async function getProfile() {
  const stored = localStorage.getItem('viksitos_user');
  if (stored) {
    return JSON.parse(stored);
  }
  
  const profile = await checkAuth();
  if (profile) {
    localStorage.setItem('viksitos_user', JSON.stringify(profile));
    return profile;
  }
  
  return null;
}

// Require authentication
async function requireAuth(requiredRole = null) {
  if (!initSupabase()) {
    window.location.href = 'login.html';
    return null;
  }

  const profile = await getProfile();
  if (!profile) {
    window.location.href = 'login.html';
    return null;
  }

  if (requiredRole && profile.role !== requiredRole) {
    showToast('Access denied', 'error');
    window.location.href = profile.role === 'government' ? 'government.html' : 'citizen.html';
    return null;
  }

  return profile;
}

// Handle OAuth callback
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
    window.location.href = 'government.html';
  } else {
    window.location.href = 'citizen.html';
  }

  return profile;
}

// Toast notification
function showToast(message, type = 'info', duration = 5000) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const icons = {
    success: 'fa-circle-check',
    error: 'fa-circle-xmark',
    info: 'fa-circle-info',
    warning: 'fa-triangle-exclamation'
  };

  toast.innerHTML = `
    <i class="fa-solid ${icons[type] || icons.info}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, duration);
}

// Initialize login page
document.addEventListener('DOMContentLoaded', async () => {
  const loginForm = document.getElementById('loginForm');
  if (!loginForm) return;

  initSupabase();

  // Check for auth callback
  const hash = window.location.hash;
  if (hash.includes('access_token') || hash.includes('type=recovery')) {
    await handleAuthCallback();
    return;
  }

  // Check if already logged in
  const profile = await getProfile();
  if (profile) {
    window.location.href = profile.role === 'government' ? 'government.html' : 'citizen.html';
    return;
  }

  // Tab switching
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentRole = btn.dataset.role;
      
      const govFields = document.querySelectorAll('.government-only');
      govFields.forEach(el => {
        el.classList.toggle('hidden', currentRole !== 'government');
      });
    });
  });

  // Form submission
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const fullName = document.getElementById('fullName').value.trim();
    const department = document.getElementById('department')?.value || null;
    const submitBtn = document.getElementById('submitBtn');

    if (!email || !fullName) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<div class="spinner" style="width:20px;height:20px;border-width:2px;"></div> Sending...';

    const success = await loginWithEmail(email, fullName, currentRole, department);
    
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
