const API_BASE = 'http://localhost:8000/api/v1';

const chatForm        = document.getElementById('chat-form');
const userInput       = document.getElementById('user-input');
const chatContainer   = document.getElementById('chat-container').querySelector('.max-w-3xl');
const sendBtn         = document.getElementById('send-btn');
const historyList     = document.getElementById('history-list');
const newChatBtn      = document.getElementById('new-chat-btn');
const clearMemoryBtn  = document.getElementById('clear-memory-btn');
const sidebar         = document.getElementById('sidebar');
const openSidebarBtn  = document.getElementById('open-sidebar-btn');
const closeSidebarBtn = document.getElementById('close-sidebar-btn');
const sidebarOverlay  = document.getElementById('sidebar-overlay');
const confirmModal    = document.getElementById('confirm-modal');
const confirmOverlay  = document.getElementById('confirm-overlay');
const confirmCard     = document.getElementById('confirm-card');
const confirmTitle    = document.getElementById('confirm-title');
const confirmMessage  = document.getElementById('confirm-message');
const confirmCancelBtn = document.getElementById('confirm-cancel-btn');
const confirmOkBtn    = document.getElementById('confirm-ok-btn');
const toastContainer  = document.getElementById('toast-container');
const settingsModal   = document.getElementById('settings-modal');
const settingsOverlay = document.getElementById('settings-overlay');
const settingsCard    = document.getElementById('settings-card');
const openSettingsBtn = document.getElementById('open-settings-btn');
const closeSettingsBtn = document.getElementById('close-settings-btn');
const themeSelect     = document.getElementById('theme-select');
const aiModelName     = document.getElementById('ai-model-name');
const docsModal       = document.getElementById('docs-modal');
const docsOverlay     = document.getElementById('docs-overlay');
const docsCard        = document.getElementById('docs-card');
const openDocsBtn     = document.getElementById('open-docs-btn');
const closeDocsBtn    = document.getElementById('close-docs-btn');
const closeDocsBtn2   = document.getElementById('close-docs-btn-2');

// Auth elements
const authModal       = document.getElementById('auth-modal');
const mainAppContent  = document.getElementById('main-app-content');
const loginForm       = document.getElementById('login-form');
const registerForm    = document.getElementById('register-form');

let sessionId      = null;
let statusInterval = null;
let isGenerating   = false;
let activeRagType  = 'basico';
let uploadedFiles  = [];
let currentTheme   = 'dark';

document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    setupSidebar();
    setupDocsModal();
    setupRagTypeSync();
});

function getAuthHeaders() {
    const token = localStorage.getItem('access_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
}

async function initAuth() {
    const token = localStorage.getItem('access_token');
    if (!token) {
        showAuthModal();
        return;
    }
    
    try {
        // Obter settings do usuario (valida token tbm)
        const res = await fetch(`${API_BASE}/users/me/settings`, {
            headers: getAuthHeaders()
        });
        
        if (res.ok) {
            const userSettings = await res.json();
            applyUserSettings(userSettings);
            hideAuthModal();
            initApp();
        } else {
            showAuthModal();
        }
    } catch {
        showAuthModal();
    }
}

function applyUserSettings(settings) {
    // Theme
    if (settings.theme) {
        themeSelect.value = settings.theme;
        applyTheme(settings.theme);
    }
    // RAG Configs
    if (settings.rag_config) {
        const rc = settings.rag_config;
        if (rc.type) {
            // Delay para o DOM estar pronto ou forçar o clique se element existir
            setTimeout(() => {
                 const btn = document.querySelector(`.rag-type-btn[data-rag="${rc.type}"]`);
                 if(btn) btn.click();
            }, 100);
        }
        if (rc.chunk_size) document.getElementById('chunk-size').value = rc.chunk_size;
        if (rc.chunk_overlap) document.getElementById('chunk-overlap').value = rc.chunk_overlap;
        if (rc.top_k) {
            document.getElementById('topk-slider').value = rc.top_k;
            document.getElementById('topk-value').textContent = rc.top_k;
        }
    }
    // Chat Configs (LLM)
    if (settings.chat_config) {
        const cc = settings.chat_config;
        if (cc.provider) document.getElementById('llm-provider').value = cc.provider;
        setTimeout(updateModels, 0); // Update models based on provider
        if (cc.model) {
            setTimeout(() => { document.getElementById('llm-model').value = cc.model; }, 10);
        }
        if (cc.api_key) {
            document.getElementById('llm-api-key').value = cc.api_key;
        }
    }
}

function showAuthModal() {
    authModal.classList.remove('hidden');
    mainAppContent.classList.add('blur-md', 'pointer-events-none');
    
    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);
}

function hideAuthModal() {
    authModal.classList.add('hidden');
    mainAppContent.classList.remove('blur-md', 'pointer-events-none');
}

function toggleAuthMode() {
    loginForm.classList.toggle('hidden');
    registerForm.classList.toggle('hidden');
    document.getElementById('login-email').value = '';
    document.getElementById('login-password').value = '';
    document.getElementById('register-email').value = '';
    document.getElementById('register-password').value = '';
}

window.toggleAuthMode = toggleAuthMode;

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    // OAuth2PasswordRequestForm needs form data URL encoded
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    try {
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData
        });
        const data = await res.json();
        if (res.ok) {
            localStorage.setItem('access_token', data.access_token);
            localStorage.setItem('refresh_token', data.refresh_token);
            showToast('Login realizado com sucesso', 'success');
            initAuth();
        } else {
            showToast(data.detail || 'Falha no login', 'error');
        }
    } catch {
        showToast('Erro de conexao', 'error');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    
    try {
        const res = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (res.ok) {
            localStorage.setItem('access_token', data.access_token);
            localStorage.setItem('refresh_token', data.refresh_token);
            showToast('Conta criada com sucesso', 'success');
            initAuth();
        } else {
            showToast(data.detail || 'Falha no registro', 'error');
        }
    } catch {
        showToast('Erro de conexao', 'error');
    }
}

function logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    closeSettings();
    showAuthModal();
    // Limpar sessões atuais
    historyList.innerHTML = '';
    clearChatUI();
    sessionId = null;
}
window.logout = logout;

async function initApp() {
    await loadSessions();
    setupSettings();
}

function setRagType(type, btn) {
    activeRagType = type;
    document.querySelectorAll('.rag-type-btn').forEach(b => {
        b.classList.remove('active-rag', 'border-rag-gray/50', 'bg-rag-gray/15', 'text-rag-grayLight');
        b.classList.add('border-white/10', 'bg-rag-accent', 'text-gray-400');
    });
    btn.classList.add('active-rag', 'border-rag-gray/50', 'bg-rag-gray/15', 'text-rag-grayLight');
    btn.classList.remove('border-white/10', 'bg-rag-accent', 'text-gray-400');
    const labels = { basico: 'Básico', hibrido: 'Híbrido', reranking: 'Re-ranking', multiquery: 'Multi-query', agentico: 'Agêntico' };
    document.getElementById('header-rag-type').textContent = labels[type] || type;
    const radio = document.querySelector(`input[name="rag_type"][value="${type}"]`);
    if (radio) { radio.checked = true; syncRagOptions(); }
}

function setupRagTypeSync() {
    document.querySelectorAll('input[name="rag_type"]').forEach(r => {
        r.addEventListener('change', () => {
            activeRagType = r.value;
            syncRagOptions();
            const barBtn = document.querySelector(`.rag-type-btn[data-rag="${r.value}"]`);
            if (barBtn) {
                document.querySelectorAll('.rag-type-btn').forEach(b => {
                    b.classList.remove('active-rag', 'border-rag-gray/50', 'bg-rag-gray/15', 'text-rag-grayLight');
                    b.classList.add('border-white/10', 'bg-rag-accent', 'text-gray-400');
                });
                barBtn.classList.add('active-rag', 'border-rag-gray/50', 'bg-rag-gray/15', 'text-rag-grayLight');
                barBtn.classList.remove('border-white/10', 'bg-rag-accent', 'text-gray-400');
            }
            const labels = { basico: 'Básico', hibrido: 'Híbrido', reranking: 'Re-ranking', multiquery: 'Multi-query', agentico: 'Agêntico' };
            document.getElementById('header-rag-type').textContent = labels[r.value] || r.value;
        });
    });
}

function syncRagOptions() {
    document.querySelectorAll('.rag-option').forEach(el => {
        const radio = el.querySelector('input[type="radio"]');
        if (radio && radio.checked) {
            el.classList.add('selected-rag', 'border-rag-gray/30');
            el.classList.remove('border-white/5');
        } else {
            el.classList.remove('selected-rag', 'border-rag-gray/30');
            el.classList.add('border-white/5');
        }
    });
}

function openDocsModal() {
    docsModal.classList.remove('hidden');
    docsModal.classList.add('modal-visible');
    lucide.createIcons();
    requestAnimationFrame(() => {
        docsCard.style.opacity = '1';
        docsCard.style.transform = 'scale(1)';
    });
}
window.openDocsModal = openDocsModal;

function closeDocsModal() {
    docsCard.style.opacity = '0';
    docsCard.style.transform = 'scale(0.95)';
    setTimeout(() => {
        docsModal.classList.add('hidden');
        docsModal.classList.remove('modal-visible');
    }, 200);
}

function setupDocsModal() {
    openDocsBtn.addEventListener('click', openDocsModal);
    closeDocsBtn.addEventListener('click', closeDocsModal);
    closeDocsBtn2.addEventListener('click', closeDocsModal);
    docsOverlay.addEventListener('click', closeDocsModal);
    const fileInput = document.getElementById('file-input');
    fileInput.addEventListener('change', (e) => {
        handleFiles(Array.from(e.target.files));
        fileInput.value = '';
    });
}

function handleDragOver(e) {
    e.preventDefault();
    document.getElementById('upload-zone').classList.add('drag-over');
}

function handleDragLeave() {
    document.getElementById('upload-zone').classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    document.getElementById('upload-zone').classList.remove('drag-over');
    handleFiles(Array.from(e.dataTransfer.files));
}

window.handleDragOver  = handleDragOver;
window.handleDragLeave = handleDragLeave;
window.handleDrop      = handleDrop;

function handleFiles(files) {
    files.forEach(f => {
        if (!uploadedFiles.find(u => u.name === f.name)) uploadedFiles.push(f);
    });
    renderUploadedFiles();
    updateDocsCountLabel();
}

function renderUploadedFiles() {
    const container = document.getElementById('uploaded-files');
    container.innerHTML = '';
    uploadedFiles.forEach((f, i) => {
        const chip = document.createElement('div');
        chip.className = 'file-chip';
        chip.innerHTML = `
            <i data-lucide="file-text" style="width:12px;height:12px;"></i>
            <span>${f.name}</span>
            <button onclick="removeFile(${i})" class="ml-1 hover:text-red-400 transition-colors">
                <i data-lucide="x" style="width:10px;height:10px;"></i>
            </button>
        `;
        container.appendChild(chip);
    });
    lucide.createIcons();
}

function removeFile(index) {
    uploadedFiles.splice(index, 1);
    renderUploadedFiles();
    updateDocsCountLabel();
}
window.removeFile = removeFile;

function updateDocsCountLabel() {
    const n = uploadedFiles.length;
    document.getElementById('docs-count-label').textContent = n === 0 ? '0 docs' : `${n} doc${n > 1 ? 's' : ''}`;
}

function applyDocsConfig() {
    const chunkSize    = document.getElementById('chunk-size').value;
    const chunkOverlap = document.getElementById('chunk-overlap').value;
    const topK         = document.getElementById('topk-slider').value;
    const labels       = { basico: 'Básico', hibrido: 'Híbrido', reranking: 'Re-ranking', multiquery: 'Multi-query', agentico: 'Agêntico' };
    showToast(`Configurado: ${labels[activeRagType]} · Chunk ${chunkSize} · Top-${topK}`, 'success');
    closeDocsModal();
}
window.applyDocsConfig = applyDocsConfig;

function setupSidebar() {
    function toggleSidebar() {
        const isClosed = sidebar.classList.contains('-translate-x-full');
        if (isClosed) {
            sidebar.classList.remove('-translate-x-full');
            sidebarOverlay.classList.remove('hidden', 'opacity-0');
        } else {
            sidebar.classList.add('-translate-x-full');
            sidebarOverlay.classList.add('hidden', 'opacity-0');
        }
    }
    openSidebarBtn.addEventListener('click', toggleSidebar);
    closeSidebarBtn.addEventListener('click', toggleSidebar);
    sidebarOverlay.addEventListener('click', toggleSidebar);
    newChatBtn.addEventListener('click', createNewChat);
    clearMemoryBtn.addEventListener('click', clearAllMemory);
}

async function loadSessions() {
    try {
        const response = await fetch(`${API_BASE}/sessions/`, { headers: getAuthHeaders() });
        if (!response.ok) throw new Error('Failed to load sessions');
        const sessions = await response.json();
        renderSessionList(sessions);
        if (!sessionId && sessions.length > 0) {
            loadChat(sessions[0].session_id);
        } else if (!sessionId && sessions.length === 0) {
            startNewSessionUI();
        }
    } catch (error) {
        console.error('Error loading sessions:', error);
        historyList.innerHTML = '<div class="text-center text-red-400 text-xs p-4">Erro ao carregar histórico</div>';
    }
}

function renderSessionList(sessions) {
    historyList.innerHTML = '';
    if (sessions.length === 0) {
        historyList.innerHTML = '<div class="text-center text-gray-600 text-sm py-4 italic">Nenhuma consulta anterior</div>';
        return;
    }
    sessions.forEach(session => {
        const div = document.createElement('div');
        div.className = `p-3 rounded-lg cursor-pointer hover:bg-rag-gray/5 transition-colors group relative flex justify-between items-center ${session.session_id === sessionId ? 'bg-rag-gray/10 border border-rag-gray/20' : ''}`;
        const dateStr = new Date(session.created_at * 1000).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
        div.innerHTML = `
            <div class="flex-1 min-w-0" onclick="loadChat('${session.session_id}')">
                <h3 class="text-sm font-medium text-gray-200 truncate pr-2">${session.title || 'Nova Consulta'}</h3>
                <p class="text-[10px] text-gray-500">${dateStr}</p>
            </div>
            <button onclick="deleteSession('${session.session_id}', event)" class="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-opacity p-1">
                <i data-lucide="trash" class="w-3 h-3"></i>
            </button>
        `;
        historyList.appendChild(div);
    });
    lucide.createIcons();
}

async function createNewChat() {
    const currentSessions = document.querySelectorAll('#history-list > div').length;
    if (currentSessions >= 5) {
        showToast('Limite de 5 sessões atingido. Apague uma sessão antiga.', 'warning');
        return;
    }
    startNewSessionUI();
}

function startNewSessionUI() {
    sessionId = crypto.randomUUID();
    clearChatUI();
    document.querySelectorAll('#history-list > div').forEach(el => {
        el.classList.remove('bg-rag-gray/10', 'border', 'border-rag-gray/20');
    });
    addWelcomeMessage();
}

async function loadChat(id) {
    if (sessionId === id) return;
    sessionId = id;
    loadSessions();
    clearChatUI();
    showTypingIndicator();
    try {
        const response = await fetch(`${API_BASE}/sessions/${id}/history`, { headers: getAuthHeaders() });
        if (!response.ok) throw new Error('Failed to load history');
        const messages = await response.json();
        removeTypingIndicator();
        removeGeneratingIndicator();
        if (messages.length === 0) {
            addWelcomeMessage();
        } else {
            messages.forEach(msg => addMessage(msg.content, msg.role === 'user' ? 'user' : 'ai'));
        }
    } catch (error) {
        removeTypingIndicator();
        removeGeneratingIndicator();
        addMessage('Erro ao carregar histórico da sessão.', 'ai', true);
    }
}

async function deleteSession(id, event) {
    if (event) event.stopPropagation();
    const confirmed = await showConfirmModal('Apagar Sessão', 'Tem certeza que deseja apagar esta sessão? Esta ação não pode ser desfeita.');
    if (!confirmed) return;
    try {
        await fetch(`${API_BASE}/sessions/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
        if (sessionId === id) startNewSessionUI();
        showToast('Sessão apagada com sucesso.', 'success');
        loadSessions();
    } catch (error) {
        showToast('Erro ao apagar sessão.', 'error');
    }
}

async function clearAllMemory() {
    const confirmed = await showConfirmModal('Apagar Toda Memória', 'ATENÇÃO: Isso apagará TODAS as sessões e a memória completa. Esta ação é irreversível.');
    if (!confirmed) return;
    try {
        await fetch(`${API_BASE}/sessions/`, { method: 'DELETE', headers: getAuthHeaders() });
        startNewSessionUI();
        loadSessions();
        showToast('Toda a memória foi apagada.', 'success');
    } catch (error) {
        showToast('Erro ao limpar memória.', 'error');
    }
}

userInput.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
    sendBtn.disabled = this.value.trim() === '';
});

userInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!sendBtn.disabled) sendBtn.click();
    }
});

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const message = userInput.value.trim();
    if (!message) return;
    if (!sessionId) sessionId = crypto.randomUUID();

    addMessage(message, 'user');
    userInput.value = '';
    userInput.style.height = 'auto';
    sendBtn.disabled = true;

    showTypingIndicator();
    startStatusPolling();

    try {
        const response = await fetch(`${API_BASE}/chat/`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            },
            body: JSON.stringify({
                message: message,
                session_id: sessionId,
                stream: false
            })
        });

        if (response.status === 403 || response.status === 401) {
            const data = await response.json();
            stopStatusPolling();
            removeTypingIndicator();
            removeGeneratingIndicator();
            showToast(data.detail, 'warning');
            loadSessions();
            return;
        }

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.detail || 'Falha na comunicação com o servidor');
        }

        const data = await response.json();
        stopStatusPolling();
        removeTypingIndicator();
        removeGeneratingIndicator();
        addMessage(data.response, 'ai');
        if (data.session_id) sessionId = data.session_id;
        loadSessions();

    } catch (error) {
        stopStatusPolling();
        removeTypingIndicator();
        removeGeneratingIndicator();
        showToast(error.message, 'error');
        console.error('Chat error:', error);
    }
});

function startStatusPolling() {
    isGenerating = false;
    if (statusInterval) clearInterval(statusInterval);
    statusInterval = setInterval(checkStatus, 500);
}

function stopStatusPolling() {
    if (statusInterval) { clearInterval(statusInterval); statusInterval = null; }
}

async function checkStatus() {
    if (!sessionId) return;
    try {
        const res = await fetch(`${API_BASE}/sessions/${sessionId}/status`, { headers: getAuthHeaders() });
        if (res.ok) {
            const data = await res.json();
            if (data.status === 'PROCESSANDO' && !isGenerating) {
                isGenerating = true;
                removeTypingIndicator();
                showGeneratingIndicator();
            }
        }
    } catch (e) { }
}

function showGeneratingIndicator() {
    if (document.getElementById('generating-indicator-bubble')) return;
    const div = document.createElement('div');
    div.id = 'generating-indicator-bubble';
    div.className = 'flex gap-4 animate-fade-in group';
    div.innerHTML = `
        <div class="w-8 h-8 rounded-xl bg-rag-panel flex items-center justify-center flex-shrink-0 mt-1 border border-rag-gray/20">
            <i data-lucide="database" class="w-4 h-4 text-rag-gray"></i>
        </div>
        <div class="px-5 py-4 rounded-2xl shadow-xl border bg-rag-panel border-rag-gray/40 rounded-tl-sm text-gray-200 bg-gradient-to-r from-rag-panel to-rag-gray/5 relative overflow-hidden">
            <div class="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-rag-gray/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
            <div class="flex items-center gap-4 relative z-10">
                <i data-lucide="loader-2" class="w-5 h-5 text-rag-gray animate-spin"></i>
                <div class="flex flex-col">
                    <span class="text-sm font-semibold text-rag-grayLight tracking-wide">Recuperando chunks relevantes...</span>
                    <span class="text-[11px] text-gray-400 mt-0.5">Pipeline RAG em execução · Tipo: ${activeRagType}</span>
                </div>
            </div>
        </div>
    `;
    chatContainer.appendChild(div);
    lucide.createIcons();
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function removeGeneratingIndicator() {
    const bubble = document.getElementById('generating-indicator-bubble');
    if (bubble) bubble.remove();
}

function clearChatUI() {
    chatContainer.innerHTML = '';
}

function addWelcomeMessage() {
    const div = document.createElement('div');
    div.className = 'flex gap-4 animate-fade-in';
    div.innerHTML = `
        <div class="flex gap-4 animate-fade-in flex-col items-center mb-10 text-center w-full">
            <div class="w-20 h-20 rounded-2xl bg-rag-gray/10 border border-rag-gray/30 flex items-center justify-center mb-2 shadow-lg shadow-blue-900/20">
                <i data-lucide="search-code" class="w-10 h-10 text-rag-gray"></i>
            </div>
            <div class="max-w-md bg-rag-panel/60 backdrop-blur-sm p-6 rounded-2xl border border-white/5 shadow-2xl">
                <p class="text-lg text-white font-medium mb-3">Sistema RAG Pronto</p>
                <p class="text-gray-400 text-sm leading-relaxed">
                    Faça upload dos seus documentos, escolha o tipo de RAG desejado e comece a consultar seus dados com precisão semântica.
                </p>
                <div class="flex gap-2 mt-4 justify-center flex-wrap">
                    <button onclick="openDocsModal()" class="flex items-center gap-1.5 text-xs bg-rag-gray/15 hover:bg-rag-gray/25 text-rag-grayLight border border-rag-gray/30 rounded-full px-3 py-1.5 transition-all">
                        <i data-lucide="upload" class="w-3 h-3"></i> Enviar Documentos
                    </button>
                    <button onclick="openDocsModal()" class="flex items-center gap-1.5 text-xs bg-rag-accent hover:bg-rag-accent/80 text-gray-300 border border-white/5 rounded-full px-3 py-1.5 transition-all">
                        <i data-lucide="sliders" class="w-3 h-3"></i> Configurar RAG
                    </button>
                </div>
            </div>
        </div>
    `;
    chatContainer.appendChild(div);
    lucide.createIcons();
}

function showTypingIndicator() {
    const div = document.createElement('div');
    div.id = 'typing-indicator-bubble';
    div.className = 'flex gap-4 animate-fade-in group';
    div.innerHTML = `
        <div class="w-8 h-8 rounded-xl bg-rag-panel flex items-center justify-center flex-shrink-0 mt-1 border border-rag-gray/20">
            <i data-lucide="database" class="w-4 h-4 text-rag-gray"></i>
        </div>
        <div class="px-5 py-3 rounded-2xl shadow-md border bg-rag-panel border-white/5 rounded-tl-sm text-gray-200">
            <div class="flex items-center gap-3">
                <div class="flex gap-1.5 items-center">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
                <span class="typing-label">Processando consulta...</span>
            </div>
        </div>
    `;
    chatContainer.appendChild(div);
    lucide.createIcons();
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function removeTypingIndicator() {
    const bubble = document.getElementById('typing-indicator-bubble');
    if (bubble) bubble.remove();
}

function addMessage(text, sender, isError = false) {
    const div = document.createElement('div');
    div.className = 'flex gap-4 animate-fade-in group';
    const isAi = sender === 'ai';

    const avatar = document.createElement('div');
    avatar.className = `w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-1 border overflow-hidden ${isAi ? 'bg-rag-panel border-rag-gray/20' : 'bg-rag-accent border-white/10'}`;
    avatar.innerHTML = isAi
        ? '<i data-lucide="database" class="w-4 h-4 text-rag-gray"></i>'
        : '<i data-lucide="user" class="w-4 h-4 text-gray-300"></i>';

    const content = document.createElement('div');
    content.className = `p-4 rounded-2xl shadow-md border ${isAi
        ? 'bg-rag-panel border-white/5 rounded-tl-sm text-gray-200'
        : 'bg-rag-accent border-white/5 rounded-tr-sm text-white ml-auto'
    } max-w-[85%] message-content prose`;

    if (isAi) {
        content.innerHTML = marked.parse(text || '');
        if (isError) content.classList.add('text-red-400');
    } else {
        content.textContent = text;
        div.classList.add('flex-row-reverse');
    }

    div.appendChild(avatar);
    div.appendChild(content);
    chatContainer.appendChild(div);
    lucide.createIcons();

    const mainContainer = document.getElementById('chat-container');
    mainContainer.scrollTop = mainContainer.scrollHeight;
}

function showConfirmModal(title, message) {
    return new Promise((resolve) => {
        confirmTitle.textContent = title;
        confirmMessage.textContent = message;
        confirmModal.classList.remove('hidden');
        confirmModal.classList.add('modal-visible');
        lucide.createIcons();
        requestAnimationFrame(() => {
            confirmCard.style.opacity = '1';
            confirmCard.style.transform = 'scale(1)';
        });
        function cleanup() {
            confirmCancelBtn.removeEventListener('click', onCancel);
            confirmOkBtn.removeEventListener('click', onConfirm);
            confirmOverlay.removeEventListener('click', onCancel);
            document.removeEventListener('keydown', onKeydown);
        }
        function closeModal() {
            confirmCard.style.opacity = '0';
            confirmCard.style.transform = 'scale(0.95)';
            setTimeout(() => { confirmModal.classList.add('hidden'); confirmModal.classList.remove('modal-visible'); }, 200);
        }
        function onCancel()  { cleanup(); closeModal(); resolve(false); }
        function onConfirm() { cleanup(); closeModal(); resolve(true); }
        function onKeydown(e) {
            if (e.key === 'Escape') onCancel();
            if (e.key === 'Enter')  onConfirm();
        }
        confirmCancelBtn.addEventListener('click', onCancel);
        confirmOkBtn.addEventListener('click', onConfirm);
        confirmOverlay.addEventListener('click', onCancel);
        document.addEventListener('keydown', onKeydown);
    });
}

const TOAST_ICONS = { error: 'x-circle', warning: 'alert-triangle', success: 'check-circle-2', info: 'info' };

function showToast(message, type = 'info', duration = 4000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<i data-lucide="${TOAST_ICONS[type] || 'info'}" class="toast-icon"></i><span>${message}</span>`;
    toastContainer.appendChild(toast);
    lucide.createIcons();
    setTimeout(() => {
        toast.classList.add('toast-exit');
        toast.addEventListener('animationend', () => toast.remove());
    }, duration);
}

function setupSettings() {
    openSettingsBtn.addEventListener('click', openSettings);
    closeSettingsBtn.addEventListener('click', closeSettings);
    settingsOverlay.addEventListener('click', closeSettings);
    themeSelect.addEventListener('change', (e) => {
        applyTheme(e.target.value);
    });
}

function updateModels() {
    const provider = document.getElementById('llm-provider').value;
    const modelSelect = document.getElementById('llm-model');
    modelSelect.innerHTML = '';
    
    if (provider === 'gemini') {
        modelSelect.innerHTML = `
            <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
            <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
            <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
        `;
    } else if (provider === 'openai') {
        modelSelect.innerHTML = `
            <option value="gpt-4o">GPT-4o</option>
            <option value="gpt-4o-mini">GPT-4o Mini</option>
            <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
        `;
    } else if (provider === 'claude') {
        modelSelect.innerHTML = `
            <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
            <option value="claude-3-opus-20240229">Claude 3 Opus</option>
            <option value="claude-3-haiku-20240307">Claude 3 Haiku</option>
        `;
    }
}
window.updateModels = updateModels;

async function saveSettings() {
    const theme = themeSelect.value;
    const rag_config = {
        type: activeRagType,
        chunk_size: parseInt(document.getElementById('chunk-size').value),
        chunk_overlap: parseInt(document.getElementById('chunk-overlap').value),
        top_k: parseInt(document.getElementById('topk-slider').value)
    };
    const chat_config = {
        provider: document.getElementById('llm-provider').value,
        model: document.getElementById('llm-model').value,
        api_key: document.getElementById('llm-api-key').value
    };
    
    try {
        const res = await fetch(`${API_BASE}/users/me/settings`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            },
            body: JSON.stringify({ theme, rag_config, chat_config })
        });
        
        if (res.ok) {
            showToast('Configurações salvas no servidor', 'success');
            closeSettings();
        } else {
            showToast('Erro ao salvar no servidor', 'error');
        }
    } catch {
        showToast('Erro de conexao', 'error');
    }
}
window.saveSettings = saveSettings;

function openSettings() {
    settingsModal.classList.remove('hidden');
    settingsModal.classList.add('modal-visible');
    lucide.createIcons();
    requestAnimationFrame(() => {
        settingsCard.style.opacity = '1';
        settingsCard.style.transform = 'scale(1)';
    });
}

function closeSettings() {
    settingsCard.style.opacity = '0';
    settingsCard.style.transform = 'scale(0.95)';
    setTimeout(() => {
        settingsModal.classList.add('hidden');
        settingsModal.classList.remove('modal-visible');
    }, 200);
}

function loadTheme() {
    // Theme loading delegaod ao profile setting na API no momento do login
}

function applyTheme(theme) {
    if (theme === 'light') document.body.classList.add('theme-light');
    else document.body.classList.remove('theme-light');
}

window.loadChat      = loadChat;
window.deleteSession = deleteSession;
window.setRagType    = setRagType;