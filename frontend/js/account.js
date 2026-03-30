'use strict';

async function loadAccountInfo() {
  try {
    const res = await fetch(`${API}/users/me`, { headers: getHeaders() });
    if (res.ok) {
      const u = await res.json();
      const el = document.getElementById('account-email');
      if (el) el.textContent = u.email;
    }
  } catch (e) {
    console.error("Account info load failed", e);
  }
}
window.loadAccountInfo = loadAccountInfo;

window.initAccount = function() {
    const btn = document.getElementById('account-logout-btn');
    if (btn) {
        btn.addEventListener('click', () => {
            if(window.logout) window.logout();
        });
    }
};
