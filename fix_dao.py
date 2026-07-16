import os

path = r'C:\Users\omarb\Desktop\genlayer\dao_temp\contracts\dao.py'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()
    
# Replace the bad line
content = content.replace('"execution_data": execution_data,', '"execution_data": "{}",')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed!")
