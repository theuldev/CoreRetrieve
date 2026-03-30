'use strict';

function updateCragVisibility() {
    const activeCard = document.querySelector('.rag-arch-card.active');
    const ragType = activeCard ? activeCard.dataset.rag : 'basico';
    const container = document.getElementById('crag-settings-container');
    if (container) {
        if (ragType === 'crag') container.classList.remove('hidden');
        else container.classList.add('hidden');
    }
}

function selectRagCard(type) {
  document.querySelectorAll('.rag-arch-card').forEach(c => {
    const on = c.dataset.rag === type;
    c.classList.toggle('active', on);
    const b = c.querySelector('.rag-active-badge'); if (b) b.classList.toggle('hidden', !on);
    c.classList.toggle('ring-2', on);
    c.classList.toggle('ring-tertiary/40', on);
  });
  updateCragVisibility();
}
window.selectRagCard = selectRagCard;

async function saveSettings() {
    const activeCard = document.querySelector('.rag-arch-card.active');
    const ragType = activeCard ? activeCard.dataset.rag : 'basico';
    const cragApiKeyEl = document.getElementById('crag-api-key');
    
    if (ragType === 'crag') {
        const cragApiKey = cragApiKeyEl?.value.trim();
        if (!cragApiKey) {
            window.showToast('A API Key do CRAG é obrigatória.', 'error');
            cragApiKeyEl?.focus();
            cragApiKeyEl?.classList.add('ring-2', 'ring-error/50');
            return;
        }
    }
    if (cragApiKeyEl) cragApiKeyEl.classList.remove('ring-2', 'ring-error/50');

    const apiKeyEl = document.getElementById('llm-api-key');
    const apiKey = apiKeyEl.value.trim();

    if (!apiKey) {
      window.showToast('A API Key é obrigatória.', 'error');
      apiKeyEl.focus();
      apiKeyEl.classList.add('ring-2', 'ring-error/50');
      return;
    }
    apiKeyEl.classList.remove('ring-2', 'ring-error/50');

    const settings = {
      rag_config: {
        mode: ragType,
        chunk_size: parseInt(document.getElementById('chunk-size').value) || 512,
        chunk_overlap: parseInt(document.getElementById('chunk-overlap').value) || 64,
        top_k: parseInt(document.getElementById('topk-slider').value) || 5,
        crag_provider: document.getElementById('crag-provider')?.value,
        crag_api_key: document.getElementById('crag-api-key')?.value,
        re_ranking: document.getElementById('toggle-reranking')?.checked || false,
        hybrid_search: document.getElementById('toggle-hybrid')?.checked || false,
        similarity_filter: document.getElementById('toggle-similarity')?.checked || false
      },
      chat_config: {
        provider: document.getElementById('llm-provider').value,
        model: document.getElementById('llm-model').value,
        api_key: apiKey
      }
    };

    localStorage.setItem('core_settings', JSON.stringify(settings));

    try {
      const res = await fetch(`${API}/users/me/settings`, {
        method: 'PUT',
        headers: getHeaders(true),
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        if (!window.userData) window.userData = {};
        window.userData.rag_config = settings.rag_config;
        window.userData.chat_config = settings.chat_config;
        window.showToast('Configurações salvas com sucesso!', 'success');
      } else {
        window.showToast('Erro ao persistir no servidor.', 'warning');
      }
    } catch {
      window.showToast('Salvo localmente (Servidor Offline).', 'info');
    }
}
window.saveSettings = saveSettings;

function applyUserSettings(settings) {
  if (!settings) settings = JSON.parse(localStorage.getItem('core_settings') || '{}');
  if (settings.chat_config) {
    const cc = settings.chat_config;
    if (cc.provider) document.getElementById('llm-provider').value = cc.provider;
    if (window.updateModels) window.updateModels(); /* From dashboard or general script */
    if (cc.model) document.getElementById('llm-model').value = cc.model;
    if (cc.api_key) document.getElementById('llm-api-key').value = cc.api_key;
  }
  if (settings.rag_config) {
    const rc = settings.rag_config;
    if (rc.mode || rc.type) {
      selectRagCard(rc.mode || rc.type);
    }
    ['chunk_size', 'chunk_overlap', 'top_k'].forEach(k => {
      if (rc[k]) {
        const d = { chunk_size: 'chunk-size', chunk_overlap: 'chunk-overlap', top_k: 'topk-slider' };
        const el = document.getElementById(d[k]);
        if (el) {
          el.value = rc[k];
          if (k === 'top_k') {
             const disp = document.getElementById('topk-display');
             if (disp) disp.textContent = rc[k];
          }
        }
      }
    });
    if (rc.crag_provider) {
        const el = document.getElementById('crag-provider');
        if (el) el.value = rc.crag_provider;
    }
    if (rc.crag_api_key) {
        const el = document.getElementById('crag-api-key');
        if (el) el.value = rc.crag_api_key;
    }
    if (rc.re_ranking !== undefined) document.getElementById('toggle-reranking').checked = rc.re_ranking;
    if (rc.hybrid_search !== undefined) document.getElementById('toggle-hybrid').checked = rc.hybrid_search;
    if (rc.similarity_filter !== undefined) document.getElementById('toggle-similarity').checked = rc.similarity_filter;
  }
  
  if(settings.theme && window.applyTheme) window.applyTheme(settings.theme);
}
window.applyUserSettings = applyUserSettings;

async function loadUserSettings() {
  try {
    const res = await fetch(`${API}/users/me/settings`, { headers: getHeaders() });
    if (res.ok) {
      const data = await res.json();
      applyUserSettings(data.settings);
    } else {
      applyUserSettings();
    }
  } catch {
    applyUserSettings();
  }
}
window.loadUserSettings = loadUserSettings;

function updateModels() {
  const p = document.getElementById('llm-provider')?.value;
  const s = document.getElementById('llm-model');
  const m = {
    gemini: [['gemini-2.0-flash', 'Gemini 2.0 Flash'], ['gemini-1.5-pro', 'Gemini 1.5 Pro']],
    openai: [['gpt-4o', 'GPT-4o'], ['gpt-4-turbo', 'GPT-4 Turbo']],
    claude: [['claude-3-5-sonnet', 'Claude 3.5 Sonnet']]
  };
  if (s && m[p]) s.innerHTML = m[p].map(([v, l]) => `<option value="${v}">${l}</option>`).join('');
}
window.updateModels = updateModels;

window.initSettings = function() {
    updateModels();
    document.getElementById('llm-provider')?.addEventListener('change', updateModels);
    
    const tk = document.getElementById('topk-slider');
    const tkv = document.getElementById('topk-display');
    if (tk && tkv) tk.addEventListener('input', e => tkv.textContent = e.target.value);
    
    document.getElementById('save-settings-btn')?.addEventListener('click', saveSettings);
    updateCragVisibility();
};
