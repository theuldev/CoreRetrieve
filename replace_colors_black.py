import os

files = [
    r"c:\Users\theul\source\repos\CoreRetrieve\frontend\index.html",
    r"c:\Users\theul\source\repos\CoreRetrieve\frontend\js\app.js",
    r"c:\Users\theul\source\repos\CoreRetrieve\frontend\css\style.css"
]

for filepath in files:
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        content = content.replace("red: '#ef4444'", "gray: '#a1a1aa'")
        content = content.replace("redDark: '#b91c1c'", "grayDark: '#52525b'")
        content = content.replace("redLight: '#f87171'", "grayLight: '#d4d4d8'")
        
        content = content.replace("blue: '#3B82F6'", "gray: '#a1a1aa'")
        content = content.replace("blueDark: '#1D4ED8'", "grayDark: '#52525b'")
        content = content.replace("blueLight: '#60A5FA'", "grayLight: '#d4d4d8'")
        
        content = content.replace("dark: '#0A0A0F'", "dark: '#000000'")
        content = content.replace("panel: '#111827'", "panel: '#09090b'")
        content = content.replace("accent: '#1F2937'", "accent: '#18181b'")
        content = content.replace("text: '#E0E0E0'", "text: '#fafafa'")
        
        content = content.replace('rag-red', 'rag-gray')
        content = content.replace('rag-blue', 'rag-gray')
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
            
print("Theme replaced successfully to black/gray!")
