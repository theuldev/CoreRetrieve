'use strict';

const loadedViews = new Set();

async function switchView(path, pushHist = true) {
  let viewId = path.replace(/^\/+/g, '') || 'dashboard';
  let params = null;

  if (viewId.includes('/')) {
    const parts = viewId.split('/').filter(Boolean);
    viewId = parts[0];
    params = parts[1];
  }

  const validViews = ['dashboard', 'chat', 'upload', 'history', 'settings', 'account'];
  if (!validViews.includes(viewId)) {
    viewId = 'dashboard';
  }

  if (pushHist) {
    const newPath = params ? `/${viewId}/${params}` : `/${viewId}`;
    if (window.location.pathname !== newPath) {
      window.history.pushState(null, '', newPath);
    }
  }

  document.querySelectorAll('.app-nav-link, .mob-nav-link, .mob-nav, .nav-item').forEach(l => {
    l.classList.remove('bg-surface-container-low', 'text-primary', 'font-bold');
    if (l.dataset.view === viewId) l.classList.add('bg-surface-container-low', 'text-primary', 'font-bold');
  });

  const container = document.getElementById('view-container');
  if (!container) return;

  Array.from(container.children).forEach(c => c.classList.add('hidden'));

  let viewEl = document.getElementById(`view-${viewId}`);
  if (!viewEl) {
    try {
      const res = await fetch(`/views/${viewId}.html`);
      if (res.ok) {
        const html = await res.text();
        const wrapper = document.createElement('div');
        wrapper.innerHTML = html;
        viewEl = wrapper.firstElementChild;
        container.appendChild(viewEl);

        // Inicializa scripts específicos
        if (viewId === 'chat' && window.initChat) window.initChat(params);
        if (viewId === 'settings' && window.initSettings) window.initSettings();
        if (viewId === 'upload' && window.initUpload) window.initUpload();
        if (viewId === 'dashboard' && window.loadDashboard) window.loadDashboard();
        if (viewId === 'history' && window.loadHistory) window.loadHistory();
        if (viewId === 'account' && window.initAccount) window.initAccount();
      } else {
        // Se falhar ao carregar o HTML da view, volta pro dashboard
        if (viewId !== 'dashboard') switchView('dashboard');
      }
    } catch (e) {
      console.error(e);
      if (viewId !== 'dashboard') switchView('dashboard');
    }
  } else {
    viewEl.classList.remove('hidden');
    // Re-inicializa dados mesmo que a view já exista
    if (viewId === 'chat' && window.initChat) window.initChat(params);
    if (viewId === 'dashboard' && window.loadDashboard) window.loadDashboard();
    if (viewId === 'history' && window.loadHistory) window.loadHistory();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const initialPath = window.location.pathname;
  switchView(initialPath, true);
});

const initialPath = window.location.pathname.replace(/^\/+/g, '');
switchView(initialPath || 'dashboard', !initialPath);

window.addEventListener('popstate', () => {
  const newPath = window.location.pathname.replace(/^\/+/g, '') || 'dashboard';
  switchView(newPath, false);
});

document.querySelectorAll('.app-nav-link, .mob-nav-link, .mob-nav, .nav-item').forEach(el => {
  el.addEventListener('click', e => {
    e.preventDefault();
    switchView(e.currentTarget.dataset.view);
  });
});

window.switchView = switchView;

function applyTheme(th) {
  const root = document.documentElement;
  if (th === 'dark') { root.classList.add('dark'); localStorage.theme = 'dark'; }
  else if (th === 'light') { root.classList.remove('dark'); localStorage.theme = 'light'; }
  else {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.removeItem('theme');
  }
}
window.applyTheme = applyTheme;

function initApp() {
  if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  if (window.loadUserSettings) loadUserSettings();

  const initialHash = window.location.hash.replace('#', '') || 'dashboard';
  switchView(initialHash, false);

  window.addEventListener('popstate', () => {
    const newHash = window.location.hash.replace('#', '') || 'dashboard';
    switchView(newHash, false);
  });

  document.querySelectorAll('.app-nav-link, .mob-nav-link, .mob-nav, .nav-item').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      switchView(e.currentTarget.dataset.view);
    });
  });

  document.getElementById('mob-menu-btn')?.addEventListener('click', () => {
    document.getElementById('mob-sidebar').classList.remove('-translate-x-full');
    document.getElementById('mob-sidebar-overlay').classList.remove('hidden');
  });
  const cmb = () => {
    document.getElementById('mob-sidebar').classList.add('-translate-x-full');
    document.getElementById('mob-sidebar-overlay').classList.add('hidden');
  };
  document.getElementById('mob-close-btn')?.addEventListener('click', cmb);
  document.getElementById('mob-sidebar-overlay')?.addEventListener('click', cmb);

  document.getElementById('darkmode-btn')?.addEventListener('click', () => {
    const isDark = document.documentElement.classList.contains('dark');
    applyTheme(isDark ? 'light' : 'dark');
  });
}
window.initApp = initApp;

document.addEventListener('DOMContentLoaded', () => {
  if (window.initAuth) initAuth();
});
document.querySelectorAll('.app-nav-link, .mob-nav-link, .mob-nav, .nav-item').forEach(el => {
  el.addEventListener('click', e => {
    e.preventDefault();
    switchView(e.currentTarget.dataset.view);
  });
});

window.switchView = switchView;

function applyTheme(th) {
  const root = document.documentElement;
  if (th === 'dark') { root.classList.add('dark'); localStorage.theme = 'dark'; }
  else if (th === 'light') { root.classList.remove('dark'); localStorage.theme = 'light'; }
  else {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.removeItem('theme');
  }
}
window.applyTheme = applyTheme;

function initApp() {
  if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  if (window.loadUserSettings) loadUserSettings();

  const initialHash = window.location.hash.replace('#', '') || 'dashboard';
  switchView(initialHash, false);

  window.addEventListener('popstate', () => {
    const newHash = window.location.hash.replace('#', '') || 'dashboard';
    switchView(newHash, false);
  });

  document.querySelectorAll('.app-nav-link, .mob-nav-link, .mob-nav, .nav-item').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      switchView(e.currentTarget.dataset.view);
    });
  });

  document.getElementById('mob-menu-btn')?.addEventListener('click', () => {
    document.getElementById('mob-sidebar').classList.remove('-translate-x-full');
    document.getElementById('mob-sidebar-overlay').classList.remove('hidden');
  });
  const cmb = () => {
    document.getElementById('mob-sidebar').classList.add('-translate-x-full');
    document.getElementById('mob-sidebar-overlay').classList.add('hidden');
  };
  document.getElementById('mob-close-btn')?.addEventListener('click', cmb);
  document.getElementById('mob-sidebar-overlay')?.addEventListener('click', cmb);

  document.getElementById('darkmode-btn')?.addEventListener('click', () => {
    const isDark = document.documentElement.classList.contains('dark');
    applyTheme(isDark ? 'light' : 'dark');
  });
}
window.initApp = initApp;

document.addEventListener('DOMContentLoaded', () => {
  if (window.initAuth) initAuth();
});