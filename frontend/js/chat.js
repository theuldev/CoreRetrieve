'use strict';

let currentSessionId = null;

async function loadMessages(sessionId) {
  const c = document.getElementById('chat-messages');
  if (!c) return;

  c.innerHTML = '<div class="text-sm text-on-surface-variant italic text-center py-8 animate-pulse">Carregando mensagens...</div>';

  try {
    const res = await fetch(`${window.API}/sessions/${sessionId}/messages`, { headers: window.getHeaders() });
    if (res.ok) {
      const messages = await res.json();
      c.innerHTML = '';

      if (messages.length === 0) {
        _showWelcome();
      } else {
        messages.forEach(m => {
          if (m.role === 'user') {
            c.insertAdjacentHTML('beforeend', _userBubble(m.content));
          } else {
            c.insertAdjacentHTML('beforeend', _botBubble(m.content));
          }
        });
      }
      c.scrollTop = c.scrollHeight;
    } else {
      c.innerHTML = '';
      _showWelcome();
    }
  } catch (err) {
    c.innerHTML = '';
    _showWelcome();
    if(window.showToast) window.showToast('Erro ao carregar mensagens', 'error');
  }
}

function _showWelcome() {
  const c = document.getElementById('chat-messages');
  if (!c) return;
  c.innerHTML = `
    <div class="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-80">
      <div class="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center text-primary mb-2">
        <span class="material-symbols-outlined text-4xl">smart_toy</span>
      </div>
      <h3 class="text-xl font-bold text-on-surface">Como posso ajudar hoje?</h3>
      <p class="max-w-xs text-sm text-on-surface-variant">Selecione um documento ou comece a digitar para iniciar uma análise inteligente.</p>
    </div>`;
}

window.initChat = function (sessionId) {
  currentSessionId = sessionId || null;
  const c = document.getElementById('chat-messages');
  if (!c) return;

  if (currentSessionId) {
    loadMessages(currentSessionId);
  } else {
    c.innerHTML = '';
    _showWelcome();
  }

  const input = document.getElementById('chat-input');
  if (input) {
    input.value = '';
    _setSendDisabled(true);
    input.addEventListener('input', () => _setSendDisabled(!input.value.trim()));
    input.onkeydown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } };
  }

  const sendBtn = document.getElementById('send-btn');
  if (sendBtn) sendBtn.onclick = sendMessage;

  const newChatBtn = document.getElementById('new-chat-btn');
  if (newChatBtn) {
    newChatBtn.onclick = () => {
      currentSessionId = null;
      window.history.pushState(null, '', '/chat');
      c.innerHTML = '';
      _showWelcome();
    };
  }
};

function _userBubble(text, isUser = true) {
  if (!isUser) return _botBubble(text);
  return `
    <div class="flex flex-col items-end animate-fade-in">
      <div class="max-w-[85%] bg-primary text-on-primary rounded-2xl rounded-tr-none px-5 py-4 shadow-sm">
        <p class="text-sm leading-relaxed">${text}</p>
      </div>
    </div>`;
}

function _botBubble(text) {
  const html = (window.marked && typeof window.marked.parse === 'function') ? window.marked.parse(text) : text;
  return `
    <div class="flex flex-col items-start animate-fade-in">
      <div class="flex items-center gap-2 mb-1.5 ml-1">
        <div class="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
          <span class="material-symbols-outlined text-[14px] text-primary">smart_toy</span>
        </div>
        <span class="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Assistente</span>
      </div>
      <div class="max-w-[85%] bg-surface-container-high border border-surface-container-highest rounded-2xl rounded-tl-none px-5 py-4 shadow-sm">
        <div class="prose prose-sm dark:prose-invert max-w-none text-on-surface leading-relaxed">
          ${html}
        </div>
      </div>
    </div>`;
}

function _setSendDisabled(disabled) {
  const btn = document.getElementById('send-btn');
  if (btn) btn.disabled = disabled;
}

async function sendMessage() {
  const input = document.getElementById('chat-input');
  const text = input?.value.trim();
  if (!text) return;

  _setSendDisabled(true);
  input.value = '';

  const c = document.getElementById('chat-messages');
  c.insertAdjacentHTML('beforeend', _userBubble(text));
  c.scrollTop = c.scrollHeight;

  const tid = 'typing-' + Date.now();
  c.insertAdjacentHTML('beforeend', _typingIndicator(tid));
  c.scrollTop = c.scrollHeight;

  try {
    const res = await fetch(`${window.API}/chat`, {
      method: 'POST',
      headers: window.getHeaders(true),
      body: JSON.stringify({
        message: text,
        session_id: currentSessionId
      })
    });

    document.getElementById(tid)?.remove();

    if (res.ok) {
      const data = await res.json();
      currentSessionId = data.session_id;
      window.history.replaceState(null, '', `/chat/${currentSessionId}`);
      c.insertAdjacentHTML('beforeend', _botBubble(data.response));
    } else {
      c.insertAdjacentHTML('beforeend', _errorBubble('Erro ao processar resposta.'));
    }
  } catch (err) {
    document.getElementById(tid)?.remove();
    c.insertAdjacentHTML('beforeend', _errorBubble('Erro de conexão.', true));
  }
  c.scrollTop = c.scrollHeight;
}

function _typingIndicator(id) {
  return `
    <div id="${id}" class="flex flex-col items-start animate-fade-in">
      <div class="max-w-[85%] bg-surface-container-high rounded-2xl rounded-tl-none px-5 py-4 shadow-sm">
        <div class="flex gap-1.5 items-center h-5">
          <div class="w-1.5 h-1.5 bg-tertiary rounded-full animate-bounce"></div>
          <div class="w-1.5 h-1.5 bg-tertiary rounded-full animate-bounce" style="animation-delay:0.1s"></div>
          <div class="w-1.5 h-1.5 bg-tertiary rounded-full animate-bounce" style="animation-delay:0.2s"></div>
        </div>
      </div>
    </div>`;
}

function _errorBubble(msg, isNetwork = false) {
  return `<div class="p-3 bg-error/10 text-error text-xs rounded-lg">${msg}</div>`;
}