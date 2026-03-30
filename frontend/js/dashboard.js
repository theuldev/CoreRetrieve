'use strict';

async function loadDashboard() {
  const dashSessionsList = document.getElementById('dash-sessions-list');
  const dashStatsDocs = document.getElementById('stat-docs');
  const dashStatsTokens = document.getElementById('stat-tokens');
  const dashStatsSessions = document.getElementById('stat-sessions');
  const dashStatsQueries = document.getElementById('stat-queries');
  const dashUsageChart = document.getElementById('usage-chart');

  try {
    const stUrl = `${API}/stats`;
    const stRes = await fetch(stUrl, { headers: getHeaders() });
    if (stRes.ok) {
      const s = await stRes.json();
      if (dashStatsDocs) dashStatsDocs.textContent = s.total_files || '0';
      if (dashStatsTokens) dashStatsTokens.textContent = (s.total_vectors || 0).toLocaleString();
      if (dashStatsSessions) dashStatsSessions.textContent = s.total_sessions || '0';
      if (dashStatsQueries) dashStatsQueries.textContent = s.total_messages || '0';

      if (dashUsageChart && s.activity_timeline && s.activity_timeline.length > 0) {
        const counts = s.activity_timeline.map(x => x.count);
        const max = Math.max(...counts, 1);
        dashUsageChart.innerHTML = s.activity_timeline.map(x => {
          const h = (x.count / max) * 100;
          return `
            <div class="w-1.5 md:w-2 bg-primary/20 rounded-t-sm relative group h-full flex flex-col justify-end">
              <div class="w-full bg-primary rounded-t-sm transition-all duration-500 ease-out" style="height: ${h}%"></div>
              <div class="absolute -top-8 left-1/2 -translate-x-1/2 bg-surface-container-highest text-on-surface text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-10 shadow-sm">${x.count} queries</div>
            </div>`;
        }).join('');
      } else if (dashUsageChart) {
        dashUsageChart.innerHTML = '<div class="text-[10px] text-on-surface-variant italic opacity-50">Sem atividade recente</div>';
      }
    }
  } catch (e) {
    console.error("Dashboard stats load failed", e);
  }

  try {
    const sessRes = await fetch(`${API}/sessions`, { headers: getHeaders() });
    if (!dashSessionsList) return;

    if (sessRes.ok) {
      const sessions = await sessRes.json();
      if (!sessions || sessions.length === 0) {
        dashSessionsList.innerHTML = '<div class="text-sm text-on-surface-variant italic py-4">Nenhuma sessão encontrada.</div>';
      } else {
        dashSessionsList.innerHTML = sessions.slice(0, 3).map(s => `
          <div onclick="switchView('chat/${s.id}')" class="flex items-center gap-4 p-4 rounded-xl bg-surface-container-low hover:bg-surface-container-high transition-all cursor-pointer group">
            <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <span class="material-symbols-outlined">chat_bubble</span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-bold text-sm truncate">${escapeHtml(s.title || 'Nova Conversa')}</p>
              <p class="text-[11px] text-on-surface-variant mt-0.5">${formatDateShort(s.created_at)}</p>
            </div>
            <span class="material-symbols-outlined text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
          </div>
        `).join('');
      }
    } else {
      dashSessionsList.innerHTML = '<div class="text-sm text-on-surface-variant italic py-4">Erro ao carregar sessões.</div>';
    }
  } catch (e) {
    console.error("Failed to load dashboard sessions:", e);
    if (dashSessionsList) dashSessionsList.innerHTML = '<div class="text-sm text-on-surface-variant italic py-4">Erro de conexão.</div>';
  }
}
window.loadDashboard = loadDashboard;
