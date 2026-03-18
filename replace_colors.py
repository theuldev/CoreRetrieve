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
        
        content = content.replace("blue: '#3B82F6'", "red: '#ef4444'")
        content = content.replace("blueDark: '#1D4ED8'", "redDark: '#b91c1c'")
        content = content.replace("blueLight: '#60A5FA'", "redLight: '#f87171'")
        
        content = content.replace('rag-blue', 'rag-red')
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
            
print("Colors replaced successfully!")
