'use strict';

const VALID_VIEWS = ['dashboard', 'chat', 'upload', 'history', 'settings', 'account'];
window.API = '/api/v1'; 

window.getHeaders = function(isJson = false) {
  const token = localStorage.getItem('access_token');
  const headers = {};
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  if (isJson) {
    headers['Content-Type'] = 'application/json';
  }
  
  return headers;
};
function parsePath(pathname) {
  const parts = pathname.replace(/^\/+/, '').split('/').filter(Boolean);
  const viewId = VALID_VIEWS.includes(parts[0]) ? parts[0] : 'dashboard';
  const param  = parts[1] || null;
  return { viewId, param };
}

async function switchView(path, push = true) {
  const { viewId, param } = parsePath('/' + String(path).replace(/^\/+/, ''));

  if (push) {
    const url = param ? `/${viewId}/${param}` : `/${viewId}`;
    if (window.location.pathname !== url) {
      window.history.pushState({ viewId, param }, '', url);
    }
  }

  document.querySelectorAll('[data-view]').forEach(el => {
    const active = el.dataset.view === viewId;
    el.classList.toggle('bg-surface-container-low', active);
    el.classList.toggle('text-primary', active);
    el.classList.toggle('font-bold', active);
  });

  const container = document.getElementById('view-container');
  if (!container) return;

  Array.from(container.children).forEach(c => c.classList.add('hidden'));

  let viewEl = document.getElementById(`view-${viewId}`);

  if (!viewEl) {
    try {
      const res = await fetch(`/views/${viewId}.html`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();
      const wrapper = document.createElement('div');
      wrapper.innerHTML = html;
      viewEl = wrapper.firstElementChild;
      if (!viewEl) throw new Error('Empty fragment');
      container.appendChild(viewEl);
      _initView(viewId, param);
      viewEl.classList.remove('hidden');
    } catch (err) {
      console.error(err);
      if (viewId !== 'dashboard') { switchView('dashboard'); return; }
    }
  } else {
    viewEl.classList.remove('hidden');
    _refreshView(viewId, param);
  }
}

function _initView(viewId, param) {
  switch (viewId) {
    case 'dashboard': if (window.loadDashboard)   window.loadDashboard(); break;
    case 'chat':      if (window.initChat)         window.initChat(param); break;
    case 'upload':    if (window.initUpload)       window.initUpload(); break;
    case 'history':
      if (window.initHistory) window.initHistory();
      if (window.loadHistory) window.loadHistory();
      break;
    case 'settings':  if (window.initSettings)    window.initSettings(); break;
    case 'account':
      if (window.initAccount)     window.initAccount();
      if (window.loadAccountInfo) window.loadAccountInfo();
      break;
  }
}

function _refreshView(viewId, param) {
  switch (viewId) {
    case 'dashboard': if (window.loadDashboard)   window.loadDashboard(); break;
    case 'history':   if (window.loadHistory)     window.loadHistory(); break;
    case 'account':   if (window.loadAccountInfo) window.loadAccountInfo(); break;
    case 'chat':      if (window.initChat)        window.initChat(param); break;
  }
}

function applyTheme(th) {
  const root = document.documentElement;
  if (th === 'dark') {
    root.classList.add('dark');
    localStorage.theme = 'dark';
  } else if (th === 'light') {
    root.classList.remove('dark');
    localStorage.theme = 'light';
  } else {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.removeItem('theme');
  }
}

function _restoreTheme() {
  if (
    localStorage.theme === 'dark' ||
    (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
  ) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

function initApp() {
  _restoreTheme();

  if (!window._navListenersAttached) {
    window._navListenersAttached = true;

    document.querySelectorAll('[data-view]').forEach(el => {
      el.addEventListener('click', e => {
        e.preventDefault();
        const view = e.currentTarget.dataset.view;
        if (view) switchView(view);
        
        document.getElementById('mob-sidebar')?.classList.add('-translate-x-full');
        document.getElementById('mob-sidebar-overlay')?.classList.add('hidden');
      });
    });

    document.getElementById('mob-menu-btn')?.addEventListener('click', () => {
      document.getElementById('mob-sidebar')?.classList.remove('-translate-x-full');
      document.getElementById('mob-sidebar-overlay')?.classList.remove('hidden');
    });

    const closeMobile = () => {
      document.getElementById('mob-sidebar')?.classList.add('-translate-x-full');
      document.getElementById('mob-sidebar-overlay')?.classList.add('hidden');
    };
    document.getElementById('mob-close-btn')?.addEventListener('click', closeMobile);
    document.getElementById('mob-sidebar-overlay')?.addEventListener('click', closeMobile);

    document.getElementById('darkmode-btn')?.addEventListener('click', () => {
      applyTheme(document.documentElement.classList.contains('dark') ? 'light' : 'dark');
    });

    document.getElementById('logout-btn')?.addEventListener('click', () => {
      if (window.logout) window.logout();
    });

    window.addEventListener('popstate', () => {
      const { viewId, param } = parsePath(window.location.pathname);
      switchView(param ? `${viewId}/${param}` : viewId, false);
    });
  }

  const { viewId, param } = parsePath(window.location.pathname);
  switchView(param ? `${viewId}/${param}` : viewId, false);
}

window.switchView = switchView;
window.applyTheme = applyTheme;
window.initApp    = initApp;

document.addEventListener('DOMContentLoaded', () => {
  _restoreTheme();
  if (window.initAuth) window.initAuth();
});