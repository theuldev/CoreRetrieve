'use strict';

async function loadHistory() {
  const c = document.getElementById('history-list');
  if(!c) return;
  c.innerHTML = '<div class="text-sm text-on-surface-variant italic text-center py-8 animate-pulse">Carregando...</div>';
  try {
    const res = await fetch(`${API}/sessions`, { headers: getHeaders() });
    if (res.ok) {
      const data = await res.json();
      if (!data.length) {
        c.innerHTML = '<div class="text-sm text-on-surface-variant text-center py-12 flex flex-col items-center opacity-60"><span class="material-symbols-outlined text-4xl mb-3">history_toggle_off</span>Nenhum histórico encontrado.</div>';
        return;
      }
     c.innerHTML = data.map(s => {
        const title = s.title || `Sessão de ${new Date(s.created_at * 1000).toLocaleDateString()}`;
        return `
          <div class="group flex items-center justify-between p-4 bg-surface-container-low border border-surface-container-highest rounded-xl hover:border-primary/30 transition-all cursor-pointer shadow-sm hover:shadow-md">
            <div class="flex-1 min-w-0" onclick="switchView('chat/${s.id}')">
              <h4 class="text-sm font-bold text-on-surface truncate pr-4 group-hover:text-primary transition-colors">${escapeHtml(title)}</h4>
              <div class="flex items-center gap-2 mt-1">
                <span class="material-symbols-outlined text-[14px] text-on-surface-variant">schedule</span>
                <span class="text-xs text-on-surface-variant">${formatDateShort(s.created_at)}</span>
              </div>
            </div>
            <button onclick="deleteSession('${s.id}')" class="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant opacity-0 group-hover:opacity-100 hover:bg-error/10 hover:text-error transition-all" title="Excluir">
              <span class="material-symbols-outlined text-lg">delete</span>
            </button>
          </div>
        `;
      }).join('');
    }
  } catch (e) {
    c.innerHTML = '<div class="text-sm text-error text-center py-8 font-medium">Erro ao carregar histórico</div>';
  }
}
window.loadHistory = loadHistory;

async function deleteSession(id) {
  if (await window.showConfirmModal('Excluir Sessão', 'Esta conversa será apagada permanentemente.')) {
    try {
      const res = await fetch(`${API}/sessions/${id}`, { method: 'DELETE', headers: getHeaders() });
      if (res.ok) {
        window.showToast('Sessão excluída', 'success');
        if (id === currentSessionId && window.resetSession) window.resetSession();
        loadHistory();
      } else window.showToast('Erro ao excluir', 'error');
    } catch { window.showToast('Erro de conexão', 'error'); }
  }
}
window.deleteSession = deleteSession;

window.initHistory = function() {
  const btn = document.getElementById('clear-history-btn');
  if(btn) {
    btn.addEventListener('click', async () => {
      if (await window.showConfirmModal('Limpar Todo Histórico', 'Isso excluirá permanentemente todas as suas conversas passadas. Mantenha em mente que as métricas do painel dependem de algumas interações passadas. Continuar?')) {
         try {
           const res = await fetch(`${API}/sessions`, { method: 'DELETE', headers: getHeaders() });
           if (res.ok) {
             window.showToast('Histórico limpo', 'success');
             if(window.resetSession) window.resetSession();
             loadHistory();
           } else {
             window.showToast('Erro ao limpar histórico', 'error');
           }
         } catch { window.showToast('Erro de conexão', 'error'); }
      }
    });
  }
};
