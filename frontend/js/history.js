'use strict';

async function loadHistory() {
  const c = document.getElementById('history-list');
  if (!c) return;

  c.innerHTML = '<div class="text-sm text-on-surface-variant italic text-center py-8 animate-pulse">Carregando histórico...</div>';

  try {
    const res = await fetch(`${window.API}/sessions`, { headers: window.getHeaders() });
    if (res.ok) {
      const data = await res.json();
      if (!data.length) {
        c.innerHTML = `
          <div class="text-sm text-on-surface-variant text-center py-12 flex flex-col items-center opacity-60">
            <span class="material-symbols-outlined text-4xl mb-3">history_toggle_off</span>
            Nenhum histórico encontrado.
          </div>`;
        return;
      }

      c.innerHTML = data.map(s => {
        const date = new Date(s.created_at * 1000).toLocaleDateString('pt-BR');
        const title = s.title || `Sessão de ${date}`;
        return `
          <div class="group flex items-center justify-between p-4 bg-surface-container-low border border-surface-container-highest rounded-xl hover:border-primary/30 transition-all cursor-pointer shadow-sm">
            <div class="flex-1 min-w-0" onclick="window.switchView('/chat/${s.id}')">
              <h4 class="text-sm font-bold text-on-surface truncate pr-4 group-hover:text-primary transition-colors">${title}</h4>
              <p class="text-xs text-on-surface-variant mt-1">Iniciada em ${date}</p>
            </div>
            <button onclick="window.deleteSession('${s.id}')" class="p-2 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-all opacity-0 group-hover:opacity-100">
              <span class="material-symbols-outlined text-xl">delete</span>
            </button>
          </div>`;
      }).join('');
    }
  } catch (err) {
    c.innerHTML = '<div class="text-xs text-error text-center py-4">Erro ao carregar histórico.</div>';
  }
}

window.loadHistory = loadHistory;

async function deleteSession(id) {
  if (confirm('Deseja excluir esta conversa?')) {
    try {
      const res = await fetch(`${window.API}/sessions/${id}`, { method: 'DELETE', headers: window.getHeaders() });
      if (res.ok) {
        if(window.showToast) window.showToast('Sessão excluída', 'success');
        loadHistory();
      }
    } catch (err) {
      if(window.showToast) window.showToast('Erro ao excluir', 'error');
    }
  }
}

window.deleteSession = deleteSession;

window.initHistory = function() {
  document.getElementById('clear-history-btn')?.addEventListener('click', async () => {
    if (confirm('Limpar todo o histórico?')) {
      try {
        const res = await fetch(`${window.API}/sessions`, { method: 'DELETE', headers: window.getHeaders() });
        if (res.ok) {
          if(window.showToast) window.showToast('Histórico limpo', 'success');
          loadHistory();
        }
      } catch (err) {
        if(window.showToast) window.showToast('Erro ao limpar', 'error');
      }
    }
  });
  loadHistory();
};