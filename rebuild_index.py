import re

with open('frontend/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

nav_pattern = r'(<a href="#" data-view="history"[^>]+>\s*<span class="material-symbols-outlined">history</span><span>History</span>\s*</a>\n\s*)(</nav>)'
account_link = r'\1<a href="#" data-view="account" class="nav-item flex items-center gap-3 px-4 py-3 rounded-xl text-on-surface-variant hover:bg-surface-container-low transition-colors">\n          <span class="material-symbols-outlined">person</span><span>Account</span>\n        </a>\n      \2'
html = re.sub(nav_pattern, account_link, html)

header_account = r'<button class="text-on-surface-variant hover:text-on-surface transition-colors">\s*<span class="material-symbols-outlined">account_circle</span>\s*</button>'
html = re.sub(header_account, r'<button data-view="account" class="app-nav-link text-on-surface-variant hover:text-on-surface transition-colors"><span class="material-symbols-outlined">account_circle</span></button>', html)

notif_icon = r'<button id="notif-btn" class="text-on-surface-variant hover:text-tertiary transition-colors relative">\s*<span class="material-symbols-outlined">notifications</span>\s*<span class="absolute top-0 right-0 w-2 h-2 bg-tertiary rounded-full border-2 border-white"></span>\s*</button>'
html = re.sub(notif_icon, '', html)

first_view = html.find('<!-- ===== DASHBOARD VIEW ===== -->')
last_section = html.rfind('</section>')
if first_view != -1 and last_section != -1:
    html = html[:first_view] + '<main id="view-container" class="w-full h-full relative"></main>\n      ' + html[last_section+10:]

script_tags = """
  <script src="js/utils.js"></script>
  <script src="js/auth.js"></script>
  <script src="js/settings.js"></script>
  <script src="js/dashboard.js"></script>
  <script src="js/chat.js"></script>
  <script src="js/upload.js"></script>
  <script src="js/history.js"></script>
  <script src="js/account.js"></script>
  <script src="js/app.js"></script>
"""
if '<script src="js/app.js">' not in html:
    html = html.replace('</body>', script_tags + '\n</body>')

with open('frontend/index.html', 'w', encoding='utf-8') as f:
    f.write(html)
print("Rebuild success")
