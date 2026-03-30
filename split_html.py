import re
import os

with open('frontend/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

os.makedirs('frontend/views', exist_ok=True)

views = ['dashboard', 'upload', 'chat', 'settings', 'history', 'account']

for v in views:
    v_upper = v.upper()
    pattern = re.compile(rf'<!-- ===== {v_upper} VIEW ===== -->\n\s*<section id="view-{v}".*?</section>\n', re.DOTALL)
    match = pattern.search(html)
    if match:
        with open(f'frontend/views/{v}.html', 'w', encoding='utf-8') as f:
            f.write(match.group(0).strip() + '\n')

container_pattern = re.compile(r'(<!-- VIEW CONTAINER -->\s*<div class="flex-1 overflow-hidden relative">).*?(</div><!-- end view-container -->)', re.DOTALL)
new_html = container_pattern.sub(
    r'\1\n        <main id="view-container" class="w-full h-full relative"></main>\n      \2',
    html
)

with open('frontend/index.html', 'w', encoding='utf-8') as f:
    f.write(new_html)

print("Split completed.")
