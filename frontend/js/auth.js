'use strict';

async function initAuth() {
  _setAuthState('loading');

  const token = localStorage.getItem('access_token');
  if (!token) {
    _setAuthState('login');
    return;
  }

  try {
    const res = await fetch(`${API}/users/me`, { headers: window.getHeaders() });
    if (res.ok) {
      window.userData = await res.json();
      _onAuthSuccess();
    } else if (res.status === 401) {
      const refreshed = await attemptTokenRefresh();
      if (refreshed) {
        const res2 = await fetch(`${API}/users/me`, { headers: window.getHeaders() });
        if (res2.ok) {
          window.userData = await res2.json();
          _onAuthSuccess();
          return;
        }
      }
      _setAuthState('login');
    } else {
      _setAuthState('login');
    }
  } catch {
    _setAuthState('login');
  }
}
window.initAuth = initAuth;

function _onAuthSuccess() {
  hideAuth();
  if (window.initApp) window.initApp();
}

/**
 * Switch the auth overlay between three states:
 *   'loading' — spinner only
 *   'login'   — login form visible
 *   'register'— register form visible
 */
function _setAuthState(state) {
  const loading  = document.getElementById('auth-loading');
  const loginF   = document.getElementById('login-form');
  const registerF= document.getElementById('register-form');
  const overlay  = document.getElementById('auth-overlay');
  const mainApp  = document.getElementById('main-app');

  // Always show overlay in auth states, hide main app
  overlay?.classList.remove('hidden');
  mainApp?.classList.add('hidden');

  loading?.classList.toggle('hidden',   state !== 'loading');
  loginF?.classList.toggle('hidden',    state !== 'login');
  registerF?.classList.toggle('hidden', state !== 'register');
}

async function attemptTokenRefresh() {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${API}/auth/refresh?refresh_token=${refreshToken}`, { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      localStorage.setItem('access_token', data.access_token);
      if (data.refresh_token) localStorage.setItem('refresh_token', data.refresh_token);
      return true;
    }
  } catch (e) {
    console.error('[Auth] Token refresh failed', e);
  }
  return false;
}
window.attemptTokenRefresh = attemptTokenRefresh;

function showAuth() {
  _setAuthState('login');
  _attachAuthListeners();
}
window.showAuth = showAuth;

function hideAuth() {
  document.getElementById('auth-overlay')?.classList.add('hidden');
  document.getElementById('main-app')?.classList.remove('hidden');
}
window.hideAuth = hideAuth;

function _attachAuthListeners() {
  const lf  = document.getElementById('login-form');
  const rf  = document.getElementById('register-form');
  const t1  = document.getElementById('toggle-auth-btn');
  const t2  = document.getElementById('toggle-auth-btn-2');

  // Clone to remove stale listeners
  if (lf) { const n = lf.cloneNode(true); lf.replaceWith(n); n.addEventListener('submit', handleLogin); }
  if (rf) { const n = rf.cloneNode(true); rf.replaceWith(n); n.addEventListener('submit', handleRegister); }

  const toggleFn = () => {
    const isLogin = !document.getElementById('login-form').classList.contains('hidden');
    _setAuthState(isLogin ? 'register' : 'login');
    _attachAuthListeners(); // re-attach after clone
  };

  document.getElementById('toggle-auth-btn')?.addEventListener('click', toggleFn);
  document.getElementById('toggle-auth-btn-2')?.addEventListener('click', toggleFn);
}

async function handleLogin(e) {
  e.preventDefault();
  const email    = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const form     = new URLSearchParams({ username: email, password });

  try {
    const res  = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form,
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem('access_token', data.access_token);
      if (data.refresh_token) localStorage.setItem('refresh_token', data.refresh_token);
      try {
        const me = await fetch(`${API}/users/me`, { headers: window.getHeaders() });
        if (me.ok) window.userData = await me.json();
      } catch {}
      window.showToast('Login realizado com sucesso', 'success');
      _onAuthSuccess();
    } else {
      window.showToast(data.detail || 'Falha no login', 'error');
    }
  } catch {
    window.showToast('Erro de conexão', 'error');
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const email    = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;

  try {
    const res  = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem('access_token', data.access_token);
      if (data.refresh_token) localStorage.setItem('refresh_token', data.refresh_token);
      try {
        const me = await fetch(`${API}/users/me`, { headers: window.getHeaders() });
        if (me.ok) window.userData = await me.json();
      } catch {}
      window.showToast('Conta criada com sucesso', 'success');
      _onAuthSuccess();
    } else {
      window.showToast(data.detail || 'Falha no registro', 'error');
    }
  } catch {
    window.showToast('Erro de conexão', 'error');
  }
}

function logout() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  window.userData = null;
  if (window.resetSession) window.resetSession();
  showAuth();
  _attachAuthListeners();
}
window.logout = logout;


document.addEventListener('DOMContentLoaded', _attachAuthListeners);