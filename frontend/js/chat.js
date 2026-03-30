'use strict';

let currentSessionId = null;

async function sendMessage() {
  const i = document.getElementById('chat-input');
  const t = i.value.trim();
  if (!t) return;

  // Use global user settings instead of local select
  const ragConfig = window.userData?.rag_config || {};
  const ragType = ragConfig.mode || 'basico';
  const cragProvider = ragConfig.crag_provider;
  const cragApiKey = ragConfig.crag_api_key;

  console.log(`[Chat] Using RAG Mode: ${ragType.toUpperCase()}`);

  i.value = '';
  document.getElementById('send-btn').classList.add('opacity-50', 'pointer-events-none');

  const c = document.getElementById('chat-messages');
  c.insertAdjacentHTML('beforeend', `
    <div class="flex flex-col items-end animate-slide-in">
      <div class="max-w-[85%] bg-primary text-on-primary rounded-2xl rounded-tr-none px-5 py-3.5 shadow-md">
        <p class="text-[15px] leading-relaxed">${escapeHtml(t)}</p>
      </div>
      <span class="text-[10px] text-on-surface-variant mt-1.5 font-medium mr-1">Agora</span>
    </div>
  `);
  c.scrollTop = c.scrollHeight;
  const tid = 'typing-' + Date.now();
  c.insertAdjacentHTML('beforeend', `
    <div id="${tid}" class="flex flex-col items-start animate-fade-in">
      <div class="flex items-center gap-2 mb-1.5 ml-1">
        <div class="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
          <span class="material-symbols-outlined text-[14px] text-primary">smart_toy</span>
        </div>
        <span class="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Assistente</span>
      </div>
      <div class="max-w-[85%] bg-surface-container-high border border-none rounded-2xl rounded-tl-none px-5 py-4 shadow-sm">
        <div class="flex gap-1.5 items-center h-5">
          <div class="w-1.5 h-1.5 bg-tertiary rounded-full animate-bounce"></div>
          <div class="w-1.5 h-1.5 bg-tertiary rounded-full animate-bounce" style="animation-delay:0.1s"></div>
          <div class="w-1.5 h-1.5 bg-tertiary rounded-full animate-bounce" style="animation-delay:0.2s"></div>
        </div>
      </div>
    </div>
  `);
  c.scrollTop = c.scrollHeight;

  try {
    const res = await fetch(`${API}/chat`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({
        message: t,
        session_id: currentSessionId,
        stream: false,
        rag_type: ragType,
        crag_provider: ragType === 'crag' ? cragProvider : null,
        crag_api_key: ragType === 'crag' ? cragApiKey : null
      })
    });
    const data = await res.json();
    document.getElementById(tid).remove();

    if (res.ok) {
      if (!currentSessionId && data.session_id) {
        currentSessionId = data.session_id;
        if (window.loadHistory) window.loadHistory();
      }
      c.insertAdjacentHTML('beforeend', `
        <div class="flex flex-col items-start animate-slide-in group">
          <div class="flex items-center gap-2 mb-1.5 ml-1">
            <div class="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
              <span class="material-symbols-outlined text-[14px] text-primary">smart_toy</span>
            </div>
            <span class="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Assistente</span>
          </div>
          <div class="max-w-[85%] bg-surface-container-low border border-none rounded-2xl rounded-tl-none px-5 py-4 shadow-sm hover:shadow-md transition-shadow">
            <div class="text-[15px] leading-relaxed text-on-surface whitespace-pre-wrap">${escapeHtml(data.response || data.answer)}</div>
            ${data.context_used && data.context_used.length > 0 ? `
              <div class="mt-4 pt-4 border-t border-surface-container-highest">
                <p class="text-[10px] font-bold text-tertiary uppercase tracking-wider mb-2 flex items-center gap-1">
                  <span class="material-symbols-outlined text-[12px]">menu_book</span> Fontes
                </p>
                <div class="flex flex-wrap gap-2">
                  ${data.context_used.map(src => `<span class="text-[10px] bg-surface-container-high px-2 py-1 rounded text-on-surface-variant border border-surface-container-highest">${escapeHtml(src)}</span>`).join('')}
                </div>
              </div>
            ` : ''}
          </div>
          <span class="text-[10px] text-on-surface-variant mt-1.5 font-medium ml-1 opacity-0 group-hover:opacity-100 transition-opacity">Agora</span>
        </div>
      `);
    } else {
      c.insertAdjacentHTML('beforeend', `
        <div class="flex flex-col items-start animate-fade-in">
          <div class="max-w-[85%] bg-error/10 border border-error/20 text-error rounded-2xl rounded-tl-none px-5 py-4 shadow-sm">
            <p class="text-[14px] font-medium flex items-center gap-2"><span class="material-symbols-outlined text-lg">error</span> ${escapeHtml(data.detail || 'Erro ao processar mensagem.')}</p>
          </div>
        </div>
      `);
      if (res.status === 401 && window.logout) window.logout();
    }
  } catch (e) {
    if (document.getElementById(tid)) document.getElementById(tid).remove();
    c.insertAdjacentHTML('beforeend', `
      <div class="flex flex-col items-start animate-fade-in">
        <div class="max-w-[85%] bg-error/10 border border-error/20 text-error rounded-2xl rounded-tl-none px-5 py-4 shadow-sm">
          <p class="text-[14px] font-medium flex items-center gap-2"><span class="material-symbols-outlined text-lg">wifi_off</span> Erro de conexão com o servidor.</p>
        </div>
      </div>
    `);
  }
  c.scrollTop = c.scrollHeight;
  document.getElementById('send-btn').classList.remove('opacity-50', 'pointer-events-none');
  i.focus();
}
window.sendMessage = sendMessage;

async function loadSession(id) {
  try {
    const res = await fetch(`${API}/sessions/${id}`, { headers: getHeaders() });
    if (res.ok) {
      const s = await res.json();
      currentSessionId = id;
      const c = document.getElementById('chat-messages');
      c.innerHTML = '<div class="text-xs text-center text-on-surface-variant my-6 py-2 px-4 bg-surface-container-low rounded-full w-max mx-auto border border-surface-container-highest">Início da conversa</div>';
      s.messages.forEach(m => {
        if (m.role === 'user') {
          c.insertAdjacentHTML('beforeend', `
            <div class="flex flex-col items-end mb-4">
              <div class="max-w-[85%] bg-primary text-on-primary rounded-2xl rounded-tr-none px-5 py-3.5 shadow-md">
                <p class="text-[15px] leading-relaxed">${escapeHtml(m.content)}</p>
              </div>
              <span class="text-[10px] text-on-surface-variant mt-1.5 font-medium mr-1">${formatDateShort(m.created_at)}</span>
            </div>
          `);
        } else {
          c.insertAdjacentHTML('beforeend', `
            <div class="flex flex-col items-start mb-4 group">
              <div class="flex items-center gap-2 mb-1.5 ml-1">
                <div class="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <span class="material-symbols-outlined text-[14px] text-primary">smart_toy</span>
                </div>
                <span class="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Assistente</span>
              </div>
              <div class="max-w-[85%] bg-surface-container-low border border-none rounded-2xl rounded-tl-none px-5 py-4 shadow-sm hover:shadow-md transition-shadow">
                <div class="text-[15px] leading-relaxed text-on-surface whitespace-pre-wrap">${escapeHtml(m.content)}</div>
              </div>
              <span class="text-[10px] text-on-surface-variant mt-1.5 font-medium ml-1 opacity-0 group-hover:opacity-100 transition-opacity">${formatDateShort(m.created_at)}</span>
            </div>
          `);
        }
      });
      if (window.switchView) window.switchView('chat');
      setTimeout(() => c.scrollTop = c.scrollHeight, 50);
    }
  } catch (e) { console.error(e); }
}
window.loadSession = loadSession;

function resetSession() {
  currentSessionId = null;
  const c = document.getElementById('chat-messages');
  if (!c) return;

  c.innerHTML = `
    <div class="flex-1 flex flex-col items-center justify-center text-on-surface-variant opacity-60 h-full min-h-[300px]">
      <div class="w-20 h-20 bg-surface-container-highest rounded-full flex items-center justify-center mb-6 shadow-inner">
        <span class="material-symbols-outlined text-4xl">forum</span>
      </div>
      <p class="text-xl font-headline font-bold mb-2">Como posso ajudar?</p>
      <p class="text-sm max-w-xs text-center">Faça perguntas sobre os documentos que você fez upload na biblioteca.</p>
    </div>
  `;
}

window.resetSession = resetSession;

window.initChat = function (conversationId = null) {
  const chatInput = document.getElementById('chat-input');
  
  if (conversationId) {
    if (window.loadSession) window.loadSession(conversationId);
  } else {
    if (!currentSessionId && window.resetSession) window.resetSession();
  }

  if (chatInput) {
    chatInput.addEventListener('keypress', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
    chatInput.addEventListener('input', () => {
      const btn = document.getElementById('send-btn');
      if (btn) btn.disabled = !chatInput.value.trim();
      chatInput.style.height = 'auto';
      chatInput.style.height = (chatInput.scrollHeight) + 'px';
    });
  }
};
