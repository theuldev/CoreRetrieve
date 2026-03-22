'use strict';

const API = '/api/v1';

let sessionId = null;
let currentView = 'dashboard';
let statusInterval = null;
let isGenerating = false;
let uploadFiles = [];

document.addEventListener('DOMContentLoaded', () => {
  initDarkMode();
  initAuth();
  setupNavigation();
  setupChatInput();
  setupUpload();
  setupSettings();
  setupMobileSidebar();
});

function initDarkMode() {
  const saved = localStorage.getItem('darkMode');
  if (saved === 'true') applyDark(true);
  const btn = document.getElementById('darkmode-btn');
  if (btn) {
    btn.addEventListener('click', () => {
      const isDark = document.documentElement.classList.contains('dark');
      applyDark(!isDark);
    });
  }
}

function applyDark(on) {
  const html = document.documentElement;
  const btn = document.getElementById('darkmode-btn');
  if (on) {
    html.classList.add('dark');
    if (btn) btn.querySelector('.material-symbols-outlined').textContent = 'light_mode';
    localStorage.setItem('darkMode', 'true');
  } else {
    html.classList.remove('dark');
    if (btn) btn.querySelector('.material-symbols-outlined').textContent = 'dark_mode';
    localStorage.setItem('darkMode', 'false');
  }
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────
function getHeaders(json = false) {
  const token = localStorage.getItem('access_token');
  const h = {};
  if (token) h['Authorization'] = `Bearer ${token}`;
  if (json) h['Content-Type'] = 'application/json';
  return h;
}

async function initAuth() {
  const token = localStorage.getItem('access_token');
  if (!token) { showAuth(); return; }
  try {
    const res = await fetch(`${API}/users/me`, { headers: getHeaders() });
    if (res.ok) {
      hideAuth();
      initApp();
    } else { showAuth(); }
  } catch { showAuth(); }
}

function showAuth() {
  document.getElementById('auth-overlay').classList.remove('hidden');
  document.getElementById('main-app').classList.add('hidden');
  document.getElementById('login-form').addEventListener('submit', handleLogin);
  document.getElementById('register-form').addEventListener('submit', handleRegister);
  document.getElementById('toggle-auth-btn').addEventListener('click', toggleAuthMode);
  document.getElementById('toggle-auth-btn-2').addEventListener('click', toggleAuthMode);
}

function hideAuth() {
  document.getElementById('auth-overlay').classList.add('hidden');
  document.getElementById('main-app').classList.remove('hidden');
}

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
      showToast('Login realizado com sucesso', 'success');
      hideAuth();
      initApp();
    } else { showToast(data.detail || 'Falha no login', 'error'); }
  } catch { showToast('Erro de conexão', 'error'); }
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
      showToast('Conta criada com sucesso', 'success');
      hideAuth();
      initApp();
    } else { showToast(data.detail || 'Falha no registro', 'error'); }
  } catch { showToast('Erro de conexão', 'error'); }
}

function logout() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  sessionId = null;
  showAuth();
}
document.getElementById('logout-btn').addEventListener('click', logout);

// ─── APP INIT ─────────────────────────────────────────────────────────────────
async function initApp() {
  switchView('dashboard');
  loadSettingsFromStorage();
  try {
    const res = await fetch(`${API}/users/me`, { headers: getHeaders() });
    if (res.ok) {
      const u = await res.json();
      document.getElementById('sidebar-email').textContent = (u.email || 'Usuário').split('@')[0];
      applyUserSettings(u);
    }
  } catch { }
}

function applyUserSettings(settings) {
  if (!settings) return;
  if (settings.rag_config) {
    const rc = settings.rag_config;
    if (rc.type) {
      const sel = document.getElementById('rag-type-select');
      if (sel) sel.value = rc.type;
      selectRagCard(rc.type === 'hibrido' || rc.type === 'reranking' || rc.type === 'multiquery' || rc.type === 'agentico' ? 'hibrido' : 'basico');
    }
    if (rc.chunk_size) { const el = document.getElementById('chunk-size'); if (el) el.value = rc.chunk_size; }
    if (rc.chunk_overlap) { const el = document.getElementById('chunk-overlap'); if (el) el.value = rc.chunk_overlap; }
    if (rc.top_k) {
      const sl = document.getElementById('topk-slider'); const dp = document.getElementById('topk-display');
      if (sl) sl.value = rc.top_k; if (dp) dp.textContent = rc.top_k;
    }
  }
  if (settings.chat_config) {
    const cc = settings.chat_config;
    if (cc.provider) { const el = document.getElementById('llm-provider'); if (el) { el.value = cc.provider; updateModels(); } }
    if (cc.model) { setTimeout(() => { const el = document.getElementById('llm-model'); if (el) el.value = cc.model; }, 20); }
    if (cc.api_key) { const el = document.getElementById('llm-api-key'); if (el) el.value = cc.api_key; }
  }
}

function setupNavigation() {
  document.querySelectorAll('#sidebar-nav .nav-item').forEach(a => {
    a.addEventListener('click', (e) => { e.preventDefault(); switchView(a.dataset.view); });
  });
  document.querySelectorAll('.mob-nav').forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });
  document.querySelectorAll('.mob-nav-link').forEach(a => {
    a.addEventListener('click', (e) => { e.preventDefault(); switchView(a.dataset.view); closeMobileSidebar(); });
  });
  document.getElementById('new-analysis-btn').addEventListener('click', () => { startNewSessionUI(); switchView('chat'); });
}

function switchView(view) {
  currentView = view;
  document.querySelectorAll('.view-panel').forEach(p => p.classList.add('hidden'));
  const panel = document.getElementById(`view-${view}`);
  if (panel) { panel.classList.remove('hidden'); }

  document.querySelectorAll('#sidebar-nav .nav-item').forEach(a => a.classList.remove('active'));
  const activeLink = document.querySelector(`#sidebar-nav .nav-item[data-view="${view}"]`);
  if (activeLink) activeLink.classList.add('active');

  document.querySelectorAll('.mob-nav').forEach(b => b.classList.remove('active'));
  const mobActive = document.querySelector(`.mob-nav[data-view="${view}"]`);
  if (mobActive) mobActive.classList.add('active');

  if (view === 'dashboard') loadDashboardData();
  if (view === 'history') loadHistorySessions();
  if (view === 'upload') loadFileList();
}

// ─── MOBILE SIDEBAR ───────────────────────────────────────────────────────────
function setupMobileSidebar() {
  document.getElementById('mob-menu-btn').addEventListener('click', openMobileSidebar);
  document.getElementById('mob-close-btn').addEventListener('click', closeMobileSidebar);
  document.getElementById('mob-sidebar-overlay').addEventListener('click', closeMobileSidebar);
}
function openMobileSidebar() {
  document.getElementById('mob-sidebar').classList.remove('-translate-x-full');
  document.getElementById('mob-sidebar-overlay').classList.remove('hidden');
}
function closeMobileSidebar() {
  document.getElementById('mob-sidebar').classList.add('-translate-x-full');
  document.getElementById('mob-sidebar-overlay').classList.add('hidden');
}

async function loadDashboardData() {
  const list = document.getElementById('dash-sessions-list');
  list.innerHTML = `<div class="text-sm italic flex items-center gap-2 py-4"><div class="w-4 h-4 border-2 border-tertiary border-t-transparent rounded-full animate-spin"></div> Carregando...</div>`;

  try {
    const [sessionsRes, healthRes, filesRes] = await Promise.all([
      fetch(`${API}/sessions/`, { headers: getHeaders() }),
      fetch('/api/health'),
      fetch(`${API}/files/`, { headers: getHeaders() })
    ]);

    let sessions = sessionsRes.ok ? await sessionsRes.json() : [];
    let files = filesRes.ok ? await filesRes.json() : [];

    let totalQueries = sessions.length * 3;
    setStatText('stat-sessions', sessions.length);
    setStatText('stat-queries', totalQueries);
    setStatText('stat-docs', files.length);

    if (healthRes.ok) {
      const h = await healthRes.json();
      setStatText('stat-model', h.ai_model || '—');
    }
    renderDashboardChart(sessions);
    if (sessions.length === 0) {
      list.innerHTML = `<div class="text-center py-4 text-sm text-on-surface-variant italic">Nenhuma sessão.</div>`;
    } else {
      list.innerHTML = sessions.slice(0, 4).map(s => `
        <div onclick="loadChatAndSwitch('${s.session_id}')" class="flex items-center gap-4 p-4 rounded-xl bg-surface border-surface-container-low hover:bg-surface-container-low transition-colors group cursor-pointer border">
          <div class="w-10 h-10 rounded-xl bg-surface-container-lowest flex items-center justify-center border border-surface-container-low bg-surface-container-lowest shadow-sm shrink-0">
            <span class="material-symbols-outlined text-primary">forum</span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-bold text-sm truncate">${escapeHtml(s.title || 'Nova Consulta')}</p>
            <p class="text-[10px] text-on-surface-variant mt-0.5">${formatDateShort(s.created_at)}</p>
          </div>
          <span class="material-symbols-outlined text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity">chevron_right</span>
        </div>`).join('');
    }
    renderRecentUploads(files.slice(0, 3));

  } catch (err) {
    list.innerHTML = `<div class="text-xs text-error py-4">Erro ao carregar dados.</div>`;
  }
}

function renderDashboardChart(sessions) {
  const bars = document.querySelectorAll('.bg-surface-container-low.rounded-t-lg');
  if (!bars.length) return;

  const dayCounts = [0, 0, 0, 0, 0, 0, 0];
  const now = new Date();
  sessions.forEach(s => {
    if (!s.created_at) return;
    const d = new Date(s.created_at * 1000);
    const day = (d.getDay() + 6) % 7;
    dayCounts[day]++;
  });

  const max = Math.max(...dayCounts, 1);
  bars.forEach((bar, i) => {
    const height = Math.max(15, (dayCounts[i] / max) * 100);
    bar.style.height = `${height}%`;
    bar.title = `${dayCounts[i]} sessões`;
    bar.classList.remove('bg-surface-container-low');
    bar.classList.add('bg-primary-container');
    bar.style.transition = 'height 0.8s ease-out';
  });
}

function setStatText(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }

function formatDateShort(ts) {
  if (!ts) return '—';
  const d = new Date(ts * 1000);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

async function loadChatAndSwitch(id) { switchView('chat'); loadChat(id); }
window.loadChatAndSwitch = loadChatAndSwitch;

// ─── SESSIONS / HISTORY ───────────────────────────────────────────────────────
async function loadHistorySessions() {
  const list = document.getElementById('history-list');
  list.innerHTML = `<div class="text-center py-8 italic text-sm"><div class="w-4 h-4 border-2 border-tertiary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div> Carregando...</div>`;
  try {
    const res = await fetch(`${API}/sessions/`, { headers: getHeaders() });
    const sessions = res.ok ? await res.json() : [];
    if (!sessions.length) {
      list.innerHTML = `<div class="text-center py-16 opacity-50"><p>Histórico vazio.</p></div>`;
      return;
    }
    list.innerHTML = sessions.map(s => `
      <div class="session-item ${s.session_id === sessionId ? 'active' : ''}" id="sess-${s.session_id}">
        <div onclick="loadChatAndSwitch('${s.session_id}')" class="flex-1 min-w-0 cursor-pointer flex items-center gap-4">
          <div class="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center shrink-0">
            <span class="material-symbols-outlined text-on-surface-variant">forum</span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-sm truncate">${escapeHtml(s.title || 'Nova Consulta')}</p>
            <p class="text-[10px] text-on-surface-variant mt-0.5">${formatDateShort(s.created_at)}</p>
          </div>
        </div>
        <button onclick="deleteSession('${s.session_id}', event)" class="p-2 text-on-surface-variant hover:text-error rounded-lg">
          <span class="material-symbols-outlined text-lg">delete</span>
        </button>
      </div>`).join('');
  } catch { list.innerHTML = `<div class="text-center py-8 text-error">Erro ao carregar história.</div>`; }
}

async function deleteSession(id, event) {
  if (event) event.stopPropagation();
  if (await showConfirmModal('Apagar Sessão', 'Esta ação é definitiva.')) {
    try {
      await fetch(`${API}/sessions/${id}`, { method: 'DELETE', headers: getHeaders() });
      if (sessionId === id) startNewSessionUI();
      document.getElementById(`sess-${id}`)?.remove();
      showToast('Sessão apagada.', 'success');
      loadDashboardData();
    } catch { showToast('Erro ao apagar.', 'error'); }
  }
}
window.deleteSession = deleteSession;

async function clearAllMemory() {
  if (await showConfirmModal('Limpar Tudo', 'Apagar todas as sessões permanenetemente?')) {
    try {
      await fetch(`${API}/sessions/`, { method: 'DELETE', headers: getHeaders() });
      startNewSessionUI(); loadHistorySessions(); loadDashboardData();
      showToast('Tudo apagado.', 'success');
    } catch { showToast('Erro ao limpar.', 'error'); }
  }
}
const clearHBtn = document.getElementById('clear-history-btn'); if (clearHBtn) clearHBtn.addEventListener('click', clearAllMemory);
const clearABtn = document.getElementById('clear-all-btn'); if (clearABtn) clearABtn.addEventListener('click', clearAllMemory);

// ─── CHAT ─────────────────────────────────────────────────────────────────────
function setupChatInput() {
  const input = document.getElementById('chat-input');
  if (!input) return;
  input.addEventListener('input', function () { this.style.height = 'auto'; this.style.height = this.scrollHeight + 'px'; });
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } });
  document.getElementById('send-btn').addEventListener('click', sendMessage);
  document.getElementById('new-chat-btn').addEventListener('click', startNewSessionUI);
}

function startNewSessionUI() { sessionId = crypto.randomUUID(); clearChatUI(); renderWelcome(); }
function clearChatUI() { document.getElementById('chat-messages').innerHTML = ''; }
function renderWelcome() {
  document.getElementById('chat-messages').innerHTML = `
    <div class="max-w-3xl mx-auto text-center pt-8 pb-4">
      <div class="inline-flex items-center gap-2 text-tertiary font-medium text-sm mb-6 bg-tertiary/5 border border-tertiary/10 rounded-full px-4 py-1.5">
        <span class="material-symbols-outlined text-sm">verified</span>
        <span>Respostas baseadas nos seus documentos</span>
      </div>
      <h2 class="text-3xl lg:text-4xl font-headline font-extrabold text-on-surface tracking-tight mb-3">O que vamos analisar hoje?</h2>
      <p class="text-on-surface-variant max-w-sm mx-auto text-sm">Consulte seus dados com precisão semântica via RAG.</p>
      <div class="flex gap-3 justify-center mt-8">
        <button onclick="switchView('upload')" class="bg-surface-container-lowest border border-surface-container-low rounded-xl px-5 py-3 text-sm font-medium hover:bg-surface-container-low transition-colors shadow-sm">Upload</button>
        <button onclick="switchView('settings')" class="bg-gradient-to-br from-primary to-primary-dim text-on-primary rounded-xl px-5 py-3 text-sm font-bold shadow-sm">Configurar</button>
      </div>
    </div>`;
}

async function loadChat(id) {
  if (sessionId === id) return;
  sessionId = id;
  clearChatUI();
  showTypingIndicator();
  try {
    const res = await fetch(`${API}/sessions/${id}/history`, { headers: getHeaders() });
    removeTypingIndicator();
    if (res.ok) {
      const msgs = await res.json();
      if (!msgs.length) renderWelcome();
      else msgs.forEach(m => addMessage(m.content, m.role === 'user' ? 'user' : 'ai'));
    }
  } catch { removeTypingIndicator(); addMessage('Erro ao carregar chat.', 'ai', true); }
}

async function sendMessage() {
  const input = document.getElementById('chat-input');
  const msg = input.value.trim();
  if (!msg) return;
  if (!sessionId) sessionId = crypto.randomUUID();
  addMessage(msg, 'user');
  input.value = ''; input.style.height = 'auto';
  showTypingIndicator();
  startStatusPolling();
  try {
    const res = await fetch(`${API}/chat/`, {
      method: 'POST', headers: getHeaders(true),
      body: JSON.stringify({ message: msg, session_id: sessionId, stream: false, rag_type: document.getElementById('rag-type-select').value })
    });
    stopStatusPolling(); removeTypingIndicator(); removeGeneratingIndicator();
    if (res.ok) {
      const d = await res.json();
      addMessage(d.response, 'ai');
      loadDashboardData();
    } else { const d = await res.json(); showToast(d.detail || 'Erro', 'error'); }
  } catch { stopStatusPolling(); removeTypingIndicator(); removeGeneratingIndicator(); showToast('Erro de conexão.', 'error'); }
}

function addMessage(text, sender, isError = false) {
  const container = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = 'chat-msg max-w-3xl mx-auto';
  if (sender === 'ai') {
    div.innerHTML = `<div class="flex flex-col items-start gap-1.5"><div class="flex items-center gap-2"><div class="w-6 h-6 bg-tertiary-fixed text-on-tertiary rounded-md flex items-center justify-center font-bold text-[10px]">AI</div><span class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">CoreRetrieve</span></div><div class="ml-8 bg-surface-container-lowest border border-surface-container-low bg-surface-container-lowest p-5 rounded-2xl rounded-tl-none shadow-sm prose prose-sm ${isError ? 'text-error' : ''}">${marked.parse(text || '')}</div></div>`;
  } else {
    div.innerHTML = `<div class="flex flex-col items-end gap-1"><div class="max-w-[85%] bg-surface-container-highest text-on-surface p-4 rounded-2xl rounded-tr-none shadow-sm text-sm">${escapeHtml(text)}</div></div>`;
  }
  container.appendChild(div);
  container.parentElement.scrollTop = container.parentElement.scrollHeight;
}

function escapeHtml(t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function showTypingIndicator() {
  const container = document.getElementById('chat-messages');
  const div = document.createElement('div'); div.id = 'typing-indicator'; div.className = 'chat-msg max-w-3xl mx-auto';
  div.innerHTML = `<div class="flex flex-col items-start gap-1.5"><div class="flex items-center gap-2"><div class="w-6 h-6 bg-tertiary-fixed text-on-tertiary rounded-md flex items-center justify-center animate-pulse text-[10px]">..</div><span class="text-[10px] uppercase font-bold text-on-surface-variant">Pensando</span></div><div class="ml-8 bg-surface-container-lowest border border-surface-container-low bg-surface-container-lowest px-5 py-4 rounded-2xl rounded-tl-none shadow-sm"><div class="flex gap-1.5"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div></div></div>`;
  container.appendChild(div); container.parentElement.scrollTop = container.parentElement.scrollHeight;
}
function removeTypingIndicator() { document.getElementById('typing-indicator')?.remove(); }
function showGeneratingIndicator() {
  if (document.getElementById('gen-id')) return;
  const div = document.createElement('div'); div.id = 'gen-id'; div.className = 'chat-msg max-w-3xl mx-auto';
  div.innerHTML = `<div class="ml-8 mt-2 flex items-center gap-3 text-xs text-on-surface-variant"><div class="w-3 h-3 border border-tertiary border-t-transparent animate-spin rounded-full"></div> RAG Pipeline Ativo...</div>`;
  document.getElementById('chat-messages').appendChild(div);
}
function removeGeneratingIndicator() { document.getElementById('gen-id')?.remove(); }
function startStatusPolling() { if (statusInterval) clearInterval(statusInterval); statusInterval = setInterval(checkStatus, 800); }
function stopStatusPolling() { if (statusInterval) clearInterval(statusInterval); statusInterval = null; }
async function checkStatus() { if (!sessionId) return; try { const res = await fetch(`${API}/sessions/${sessionId}/status`, { headers: getHeaders() }); if (res.ok) { const d = await res.json(); if (d.status === 'PROCESSANDO') { removeTypingIndicator(); showGeneratingIndicator(); } } } catch { } }

// ─── UPLOAD ───────────────────────────────────────────────────────────────────
function setupUpload() {
  const fileInput = document.getElementById('file-input');
  if (!fileInput) return;
  fileInput.addEventListener('change', (e) => { handleFiles(Array.from(e.target.files)); fileInput.value = ''; });
  document.getElementById('send-files-btn').addEventListener('click', uploadAllFiles);
}

function handleDragOver(e) { e.preventDefault(); document.getElementById('upload-zone').classList.add('drag-over'); }
function handleDragLeave() { document.getElementById('upload-zone').classList.remove('drag-over'); }
function handleDrop(e) { e.preventDefault(); document.getElementById('upload-zone').classList.remove('drag-over'); handleFiles(Array.from(e.dataTransfer.files)); }
window.handleDragOver = handleDragOver; window.handleDragLeave = handleDragLeave; window.handleDrop = handleDrop;

function handleFiles(files) { files.forEach(f => { if (!uploadFiles.find(u => u.name === f.name)) uploadFiles.push(f); }); renderUploadQueue(); }
function renderUploadQueue() {
  const qDiv = document.getElementById('upload-queue'); const qList = document.getElementById('queue-list');
  if (!uploadFiles.length) { qDiv.classList.add('hidden'); return; }
  qDiv.classList.remove('hidden');
  qList.innerHTML = uploadFiles.map((f, i) => `<div class="file-chip"><span class="material-symbols-outlined text-xs">description</span><span class="truncate flex-1">${f.name}</span><button onclick="removeUploadFile(${i})"><span class="material-symbols-outlined text-xs">close</span></button></div>`).join('');
}
function removeUploadFile(i) { uploadFiles.splice(i, 1); renderUploadQueue(); }
window.removeUploadFile = removeUploadFile;

async function uploadAllFiles() {
  if (!uploadFiles.length) return;
  const btn = document.getElementById('send-files-btn');
  btn.disabled = true; btn.textContent = 'Enviando...';
  let successCount = 0;
  for (const file of uploadFiles) {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(`${API}/files/upload`, { method: 'POST', headers: getHeaders(), body: formData });
      if (res.ok) successCount++;
    } catch (e) { console.error('Upload error', e); }
  }
  showToast(`${successCount} arquivos enviados.`, 'success');
  uploadFiles = []; renderUploadQueue(); loadFileList(); loadDashboardData();
  btn.disabled = false; btn.textContent = 'Enviar Todos';
}

async function loadFileList() {
  const tbody = document.getElementById('files-table-body');
  if (!tbody) return;
  try {
    const res = await fetch(`${API}/files/`, { headers: getHeaders() });
    const files = res.ok ? await res.json() : [];
    if (!files.length) { tbody.innerHTML = `<div class="p-8 text-center text-sm opacity-50">Nenhum arquivo indexado.</div>`; return; }
    tbody.innerHTML = files.map(f => `
      <div class="flex items-center justify-between px-6 py-4 border-b border-surface-container-low bg-surface-container-lowest last:border-0 hover:bg-surface-container-low/20 transition-colors">
        <div class="flex items-center gap-3 flex-1 min-w-0">
          <span class="material-symbols-outlined text-on-surface-variant">description</span>
          <span class="text-sm font-medium truncate">${escapeHtml(f.name)}</span>
        </div>
        <span class="text-xs text-on-surface-variant px-4">${(f.size / 1024).toFixed(0)} KB</span>
        <button onclick="deleteFile(${f.id})" class="p-2 text-on-surface-variant hover:text-error"><span class="material-symbols-outlined text-sm">delete</span></button>
      </div>`).join('');
  } catch { }
}

async function deleteFile(id) {
  if (await showConfirmModal('Excluir Arquivo', 'O arquivo será removido do sistema RAG.')) {
    try {
      await fetch(`${API}/files/${id}`, { method: 'DELETE', headers: getHeaders() });
      showToast('Arquivo excluído.', 'success'); loadFileList(); loadDashboardData();
    } catch { showToast('Erro ao excluir.', 'error'); }
  }
}
window.deleteFile = deleteFile;

function renderRecentUploads(files) {
  const list = document.getElementById('recent-uploads-list');
  if (!list) return;
  if (!files.length) {
    list.innerHTML = `<div class="p-4 text-center text-[10px] opacity-30 italic">Sem atividades recentes.</div>`;
    return;
  }
  list.innerHTML = files.map(f => `
    <div class="flex items-center justify-between p-3 bg-surface-container-low/30 rounded-lg border border-surface-container-low">
      <div class="flex items-center gap-3">
        <span class="material-symbols-outlined text-green-500 text-sm">check_circle</span>
        <div class="min-w-0">
          <p class="text-[11px] font-bold truncate max-w-[140px]">${escapeHtml(f.name)}</p>
          <p class="text-[9px] text-on-surface-variant uppercase tracking-tighter">Processado</p>
        </div>
      </div>
      <button onclick="deleteFile(${f.id})" class="text-on-surface-variant hover:text-error"><span class="material-symbols-outlined text-xs">delete</span></button>
    </div>`).join('');
}

// ─── SETTINGS ─────────────────────────────────────────────────────────────────
function setupSettings() {
  const btn = document.getElementById('save-settings-btn'); if (btn) btn.addEventListener('click', saveSettings);
}
function loadSettingsFromStorage() { const s = localStorage.getItem('core_settings'); if (s) try { applyUserSettings(JSON.parse(s)); } catch { } }
async function saveSettings() {
  const settings = {
    rag_config: {
      type: document.getElementById('rag-type-select').value,
      chunk_size: parseInt(document.getElementById('chunk-size').value),
      chunk_overlap: parseInt(document.getElementById('chunk-overlap').value),
      top_k: parseInt(document.getElementById('topk-slider').value)
    },
    chat_config: {
      provider: document.getElementById('llm-provider').value,
      model: document.getElementById('llm-model').value,
      api_key: document.getElementById('llm-api-key').value
    }
  };
  localStorage.setItem('core_settings', JSON.stringify(settings));
  try {
    const res = await fetch(`${API}/users/me/settings`, { method: 'PUT', headers: getHeaders(true), body: JSON.stringify(settings) });
    showToast(res.ok ? 'Configurações salvas!' : 'Erro ao persistir no servidor.', res.ok ? 'success' : 'warning');
  } catch { showToast('Salvo localmente.', 'info'); }
}
function updateModels() {
  const p = document.getElementById('llm-provider').value; const s = document.getElementById('llm-model');
  const m = { gemini: [['gemini-2.0-flash', '2.0 Flash'], ['gemini-1.5-pro', '1.5 Pro']], openai: [['gpt-4o', 'GPT-4o']], claude: [['claude-3-5-sonnet', 'Claude 3.5']] };
  if (s) s.innerHTML = (m[p] || []).map(([v, l]) => `<option value="${v}">${l}</option>`).join('');
}
window.updateModels = updateModels;
function selectRagCard(type) {
  document.querySelectorAll('.rag-arch-card').forEach(c => {
    const on = c.dataset.rag === type;
    c.classList.toggle('active', on);
    const b = c.querySelector('.rag-active-badge'); if (b) b.classList.toggle('hidden', !on);
    c.classList.toggle('ring-2', on);
  });
  const sel = document.getElementById('rag-type-select'); if (sel) sel.value = type;
}
window.selectRagCard = selectRagCard;

// ─── UTILS ────────────────────────────────────────────────────────────────────
function showConfirmModal(title, msg) {
  return new Promise(res => {
    const m = document.getElementById('confirm-modal'); const c = document.getElementById('confirm-card');
    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-message').textContent = msg;
    m.classList.remove('hidden'); m.classList.add('flex');
    requestAnimationFrame(() => { c.style.opacity = '1'; c.style.transform = 'scale(1)'; });
    const close = (v) => {
      c.style.opacity = '0'; c.style.transform = 'scale(0.95)';
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
function showToast(msg, type = 'info') {
  const c = document.getElementById('toast-container'); const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  const icons = { success: 'check_circle', error: 'cancel', warning: 'warning', info: 'info' };
  t.innerHTML = `<span class="material-symbols-outlined">${icons[type]}</span><span>${msg}</span>`;
  c.appendChild(t); setTimeout(() => { t.classList.add('toast-exit'); t.addEventListener('animationend', () => t.remove()); }, 3000);
}
window.showToast = showToast;