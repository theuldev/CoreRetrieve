import re
import os

with open('frontend/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Since regex was messing up nested sections, let's use a simpler heuristic for extracting views:
# We know each view is wrapped between `<!-- ===== VIEWNAME VIEW ===== -->` and `</section>` 
# before the NEXT `<!-- ===== ` or `</div><!-- end view-container -->`

parts = re.split(r'(<!-- ===== [A-Z ]+ VIEW ===== -->)', html)

views = {}
for i in range(1, len(parts), 2):
    header = parts[i]
    content = parts[i+1]
    
    # Extract the name from the header
    name_match = re.search(r'===== ([A-Z ]+) VIEW', header)
    if name_match:
        name = name_match.group(1).lower().replace(' ', '')
        
        # The content goes up to the last </section> before the next split or end
        # Since it's split by <!-- =====, content is exactly everything for this view!
        # wait, the last view might include the rest of the HTML!
        if name == 'settings':
            # find last </section>
            last_section = content.rfind('</section>')
            content = content[:last_section+10]
        else:
            last_section = content.rfind('</section>')
            content = content[:last_section+10]
        
        views[name] = header + content

os.makedirs('frontend/views', exist_ok=True)
for k, v in views.items():
    with open(f'frontend/views/{k}.html', 'w', encoding='utf-8') as f:
        f.write(v.strip() + '\n')

print("Proper split completed for views: " + ", ".join(views.keys()))
