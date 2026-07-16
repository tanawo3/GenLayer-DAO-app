import sys

with open('contracts/dao.py', 'r') as f:
    content = f.read()

target = '''        if status == "PENDING":
            self.state.total_proposals = u256(int(self.state.total_proposals) + 1)'''
replacement = '''        self.state.total_proposals = u256(int(self.state.total_proposals) + 1)'''

if target in content:
    content = content.replace(target, replacement)
    print('Replaced total_proposals bug')

with open('contracts/dao.py', 'w') as f:
    f.write(content)
