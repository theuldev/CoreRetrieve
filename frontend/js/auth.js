'use strict';

async function initAuth() {
  const token = localStorage.getItem('access_token');
  if (!token) { showAuth(); return; }
  try {
    const res = await fetch(`${API}/users/me`, { headers: window.getHeaders() });
    if (res.ok) {
      window.userData = await res.json();
      hideAuth();
      if(window.initApp) window.initApp();
    } else if (res.status === 401) {
      const refreshed = await attemptTokenRefresh();
      if (refreshed) {
         const res2 = await fetch(`${API}/users/me`, { headers: window.getHeaders() });
         if (res2.ok) window.userData = await res2.json();
         hideAuth();
         if(window.initApp) window.initApp();
      } else {
         showAuth();
      }
    } else { showAuth(); }
  } catch { showAuth(); }
}
window.initAuth = initAuth;

async function attemptTokenRefresh() {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) return false;
  
  try {
    const res = await fetch(`${API}/auth/refresh?refresh_token=${refreshToken}`, { 
      method: 'POST' 
    });
    if (res.ok) {
      const data = await res.json();
      localStorage.setItem('access_token', data.access_token);
      if (data.refresh_token) localStorage.setItem('refresh_token', data.refresh_token);
      return true;
    }
  } catch (e) {
    console.error("Failed to refresh token", e);
  }
  return false;
}
window.attemptTokenRefresh = attemptTokenRefresh;

function showAuth() {
  const overlay = document.getElementById('auth-overlay');
  const loader = document.getElementById('auth-loading');
  const mainApp = document.getElementById('main-app');
  
  if (overlay) overlay.classList.remove('hidden');
  if (loader) loader.classList.add('hidden');
  if (mainApp) mainApp.classList.add('hidden');
  
  const lf = document.getElementById('login-form');
  const rf = document.getElementById('register-form');
  const t1 = document.getElementById('toggle-auth-btn');
  const t2 = document.getElementById('toggle-auth-btn-2');
  
  if (lf) {
    lf.classList.remove('hidden');
    lf.removeEventListener('submit', handleLogin);
    lf.addEventListener('submit', handleLogin);
  }
  
  if (rf) {
    rf.removeEventListener('submit', handleRegister);
    rf.addEventListener('submit', handleRegister);
  }
  
  if (t1) {
    t1.removeEventListener('click', toggleAuthMode);
    t1.addEventListener('click', toggleAuthMode);
  }
  
  if (t2) {
    t2.removeEventListener('click', toggleAuthMode);
    t2.addEventListener('click', toggleAuthMode);
  }
}
window.showAuth = showAuth;

function hideAuth() {
  document.getElementById('auth-overlay').classList.add('hidden');
  document.getElementById('main-app').classList.remove('hidden');
}
window.hideAuth = hideAuth;

function toggleAuthMode() {
  document.getElementById('login-form').classList.toggle('hidden');
  document.getElementById('register-form').classList.toggle('hidden');
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const form = new URLSearchParams();
  form.append('username', email); form.append('password', password);
  try {
    const res = await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: form });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem('access_token', data.access_token);
      if (data.refresh_token) localStorage.setItem('refresh_token', data.refresh_token);
      // Fetch and store user data
      try {
        const meRes = await fetch(`${API}/users/me`, { headers: window.getHeaders() });
        if (meRes.ok) window.userData = await meRes.json();
      } catch(e) {}
      window.showToast('Login realizado com sucesso', 'success');
      hideAuth();
      if(window.initApp) window.initApp();
    } else { window.showToast(data.detail || 'Falha no login', 'error'); }
  } catch { window.showToast('Erro de conexão', 'error'); }
}

async function handleRegister(e) {
  e.preventDefault();
  const email = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;
  try {
    const res = await fetch(`${API}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem('access_token', data.access_token);
      if (data.refresh_token) localStorage.setItem('refresh_token', data.refresh_token);
      // Fetch and store user data
      try {
        const meRes = await fetch(`${API}/users/me`, { headers: window.getHeaders() });
        if (meRes.ok) window.userData = await meRes.json();
      } catch(e) {}
      window.showToast('Conta criada com sucesso', 'success');
      hideAuth();
      if(window.initApp) window.initApp();
    } else { window.showToast(data.detail || 'Falha no registro', 'error'); }
  } catch { window.showToast('Erro de conexão', 'error'); }
}

function logout() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  if(window.resetSession) window.resetSession();
  showAuth();
}
window.logout = logout;

// Make sure logout exists on the button
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('logout-btn');
  if(btn) btn.addEventListener('click', logout);
  
  // also add it to account page logout if it exists
  const accLogout = document.getElementById('account-logout-btn');
  if(accLogout) accLogout.addEventListener('click', logout);
});
