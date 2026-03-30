'use strict';

const API = '/api/v1';

function showConfirmModal(title, msg) {
  return new Promise(res => {
    const m = document.getElementById('confirm-modal'); const c = document.getElementById('confirm-card');
    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-message').textContent = msg;
    m.classList.remove('hidden'); m.classList.add('flex');
    requestAnimationFrame(() => { if (c) { c.style.opacity = '1'; c.style.transform = 'scale(1)'; } });
    const close = (v) => {
      if (c) { c.style.opacity = '0'; c.style.transform = 'scale(0.95)'; }
      setTimeout(() => { m.classList.add('hidden'); m.classList.remove('flex'); }, 200);
      cb(); res(v);
    };
    const ok = () => close(true); const cc = () => close(false);
    const ky = (e) => { if (e.key === 'Escape') cc(); if (e.key === 'Enter') ok(); };
    const cb = () => {
      document.getElementById('confirm-ok-btn').removeEventListener('click', ok);
      document.getElementById('confirm-cancel-btn').removeEventListener('click', cc);
      document.getElementById('confirm-overlay').removeEventListener('click', cc);
      document.removeEventListener('keydown', ky);
    };
    document.getElementById('confirm-ok-btn').addEventListener('click', ok);
    document.getElementById('confirm-cancel-btn').addEventListener('click', cc);
    document.getElementById('confirm-overlay').addEventListener('click', cc);
    document.addEventListener('keydown', ky);
  });
}
window.showConfirmModal = showConfirmModal;

function showToast(msg, type = 'info') {
  const c = document.getElementById('toast-container');
  if (!c) return;
  const t = document.createElement('div');
  t.className = `toast toast-${type} flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border mb-3 animate-slide-in`;
  const icons = { success: 'check_circle', error: 'cancel', warning: 'warning', info: 'info' };
  t.innerHTML = `<span class="material-symbols-outlined">${icons[type]}</span><span class="text-sm font-medium">${msg}</span>`;
  c.appendChild(t);
  setTimeout(() => {
    t.classList.add('opacity-0', 'translate-x-8');
    t.addEventListener('transitionend', () => t.remove());
  }, 4000);
}
window.showToast = showToast;

function escapeHtml(t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
window.escapeHtml = escapeHtml;

function formatDateShort(ts) {
  if (!ts) return '—';
  const d = new Date(ts * 1000);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}
window.formatDateShort = formatDateShort;

function getHeaders(json = false) {
  const token = localStorage.getItem('access_token');
  const h = {};
  if (token) h['Authorization'] = `Bearer ${token}`;
  if (json) h['Content-Type'] = 'application/json';
  return h;
}
window.getHeaders = getHeaders;
