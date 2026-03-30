'use strict';

let isUploading = false;

window.initUpload = function() {
  setupUploadArea();
  loadLibrary();
  loadRecentActivity();
};

function setupUploadArea() {
  const d = document.getElementById('upload-zone');
  const i = document.getElementById('file-input');
  if (!d || !i) return;
  
  // Handlers attached via HTML but adding defensive listeners here too
  d.addEventListener('click', () => i.click());
  i.addEventListener('change', e => handleFiles(e.target.files));
}

// Global handlers for inline HTML events
window.handleDragOver = function(e) {
  e.preventDefault();
  e.stopPropagation();
  const d = document.getElementById('upload-zone');
  if (d) d.classList.add('border-tertiary', 'bg-tertiary/5');
};

window.handleDragLeave = function(e) {
  e.preventDefault();
  e.stopPropagation();
  const d = document.getElementById('upload-zone');
  if (d) d.classList.remove('border-tertiary', 'bg-tertiary/5');
};

window.handleDrop = function(e) {
  e.preventDefault();
  e.stopPropagation();
  const d = document.getElementById('upload-zone');
  if (d) d.classList.remove('border-tertiary', 'bg-tertiary/5');
  if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
};

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024, dm = decimals < 0 ? 0 : decimals, sizes = ['Bytes', 'KB', 'MB', 'GB'], i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

async function handleFiles(files) {
  if (isUploading) return;
  const arr = Array.from(files);
  if (!arr.length) return;
  isUploading = true;
  
  const queue = document.getElementById('upload-queue');
  const list = document.getElementById('queue-list');
  
  if (queue) queue.classList.remove('hidden');
  
  for (const f of arr) {
    const id = 'up-' + Date.now() + Math.random().toString(36).substring(7);
    if (list) {
      list.insertAdjacentHTML('afterbegin', `
        <div id="${id}" class="flex items-center gap-4 p-4 bg-surface-container-high border border-surface-container-highest rounded-xl mb-3 relative overflow-hidden group">
          <div class="absolute bottom-0 left-0 h-1 bg-primary/20 w-full"><div class="h-full bg-primary w-0 transition-all duration-300" id="pg-${id}"></div></div>
          <div class="w-10 h-10 bg-surface-container-highest rounded-lg flex items-center justify-center text-primary">
            <span class="material-symbols-outlined">${f.type.includes('pdf') ? 'picture_as_pdf' : 'description'}</span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-on-surface truncate">${escapeHtml(f.name)}</p>
            <div class="flex items-center gap-2 mt-1">
              <span class="text-[11px] text-on-surface-variant font-medium">${formatBytes(f.size)}</span>
              <span class="w-1 h-1 rounded-full bg-surface-container-highest"></span>
              <span id="st-${id}" class="text-[11px] font-bold text-tertiary">Enviando...</span>
            </div>
          </div>
          <span id="ic-${id}" class="material-symbols-outlined text-on-surface-variant animate-spin">sync</span>
        </div>
      `);
    }
    
    const fd = new FormData(); fd.append('file', f);
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API}/files/upload`, true);
      const token = localStorage.getItem('access_token');
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      
      const pg = document.getElementById(`pg-${id}`);
      const st = document.getElementById(`st-${id}`);
      const ic = document.getElementById(`ic-${id}`);
      
      xhr.upload.onprogress = e => {
        if (e.lengthComputable) {
          const pc = Math.round((e.loaded / e.total) * 100);
          if(pg) pg.style.width = pc + '%';
          if(st) st.textContent = `Enviando ${pc}%`;
        }
      };
      
      await new Promise((res, rej) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            if(pg) { pg.style.width = '100%'; pg.classList.replace('bg-primary', 'bg-success'); }
            if(st) { st.textContent = 'Concluído'; st.classList.replace('text-tertiary', 'text-success'); }
            if(ic) { ic.textContent = 'check_circle'; ic.classList.replace('text-on-surface-variant', 'text-success'); ic.classList.remove('animate-spin'); }
            res();
          } else {
            if(pg) pg.classList.replace('bg-primary', 'bg-error');
            if(st) { st.textContent = 'Erro'; st.classList.replace('text-tertiary', 'text-error'); }
            if(ic) { ic.textContent = 'error'; ic.classList.replace('text-on-surface-variant', 'text-error'); ic.classList.remove('animate-spin'); }
            rej(xhr.responseText);
          }
        };
        xhr.onerror = () => rej('Network Error');
        xhr.send(fd);
      });
    } catch (e) {
      console.error(e);
    }
  }
  isUploading = false;
  window.showToast(`Processamento de arquivos concluído`, 'success');
  loadLibrary();
  if (window.loadDashboard) window.loadDashboard();
}

async function loadLibrary() {
  const ctr = document.getElementById('files-table-body');
  if(!ctr) return;
  ctr.innerHTML = '<div class="p-8 text-center text-sm text-on-surface-variant animate-pulse italic">Carregando documentos...</div>';
  try {
    const res = await fetch(`${API}/files`, { headers: getHeaders() });
    if (res.ok) {
      const data = await res.json();
      if (!data.length) {
        ctr.innerHTML = '<div class="p-12 text-center flex flex-col items-center opacity-60"><span class="material-symbols-outlined text-5xl mb-3 text-surface-container-highest">folder_open</span><p class="text-sm font-medium italic text-on-surface-variant">Nenhum documento na biblioteca.</p></div>';
        return;
      }
      ctr.innerHTML = data.map(f => `
        <div class="group flex items-center justify-between p-4 hover:bg-surface-container-low transition-colors duration-200">
          <div class="flex items-center gap-4 min-w-0 flex-1">
            <div class="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0 text-on-surface-variant group-hover:bg-primary/10 group-hover:text-primary transition-colors">
              <span class="material-symbols-outlined text-[20px]">${f.name.endsWith('.pdf') ? 'picture_as_pdf' : 'description'}</span>
            </div>
            <div class="min-w-0">
              <h4 class="text-sm font-bold text-on-surface truncate" title="${escapeHtml(f.name)}">${escapeHtml(f.name)}</h4>
              <p class="text-[10px] text-on-surface-variant mt-0.5 font-medium uppercase tracking-wider">${formatDateShort(f.created_at)}</p>
            </div>
          </div>
          <div class="flex items-center gap-6">
            <div class="hidden md:block">
              ${f.status === 'processed' ? 
                '<span class="text-[10px] font-bold text-success bg-success/10 px-2 py-0.5 rounded-full border border-success/20 uppercase">Processado</span>' : 
                '<span class="text-[10px] font-bold text-tertiary bg-tertiary/10 px-2 py-0.5 rounded-full border border-tertiary/20 uppercase flex items-center gap-1"><span class="material-symbols-outlined text-[12px] animate-spin">sync</span> Pendente</span>'}
            </div>
            <button onclick="deleteFile('${f.id}')" class="w-8 h-8 rounded-lg text-on-surface-variant hover:bg-error/10 hover:text-error flex items-center justify-center transition-all opacity-0 group-hover:opacity-100">
              <span class="material-symbols-outlined text-sm">delete</span>
            </button>
          </div>
        </div>
      `).join('');
      loadRecentActivity();
    }
  } catch (e) {
    ctr.innerHTML = '<div class="p-8 text-center text-sm text-error">Erro ao carregar documentos</div>';
  }
}
window.loadLibrary = loadLibrary;

async function deleteFile(id) {
  if (await window.showConfirmModal('Excluir Documento', 'Deseja remover este arquivo permanentemente?')) {
    try {
      const res = await fetch(`${API}/files/${id}`, { method: 'DELETE', headers: getHeaders() });
      if (res.ok) {
        window.showToast('Documento excluído', 'success');
        loadLibrary();
        if(window.loadDashboard) window.loadDashboard();
      } else window.showToast('Erro ao excluir', 'error');
    } catch { window.showToast('Erro de conexão', 'error'); }
  }
}
window.deleteFile = deleteFile;

async function loadRecentActivity() {
  const ctr = document.getElementById('recent-uploads-list');
  if(!ctr) return;
  try {
    const res = await fetch(`${API}/files`, { headers: getHeaders() });
    if (res.ok) {
      const data = await res.json();
      const recent = data.slice(0, 5);
      if (!recent.length) {
        ctr.innerHTML = '<div class="text-sm text-on-surface-variant italic">Nenhuma atividade recente.</div>';
        return;
      }
      ctr.innerHTML = recent.map(f => `
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-on-surface-variant shrink-0">
            <span class="material-symbols-outlined text-sm">attach_file</span>
          </div>
          <div class="min-w-0">
            <p class="text-xs font-bold text-on-surface truncate">${escapeHtml(f.name)}</p>
            <p class="text-[10px] text-on-surface-variant">${formatDateShort(f.created_at)}</p>
          </div>
        </div>
      `).join('');
    }
  } catch (e) {
    console.error('Error loading recent activity:', e);
  }
}
window.loadRecentActivity = loadRecentActivity;
