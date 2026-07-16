import sys

with open('contracts/dao.py', 'r') as f:
    content = f.read()

# Add _extract_text
if 'def _extract_text' not in content:
    content += '''\n\ndef _extract_text(page) -> str:
    \"\"\"Normalize the various shapes gl.nondet.web.render may return into text.\"\"\"
    if isinstance(page, str):
        return page
    if isinstance(page, dict):
        if "text" in page:
            return str(page["text"])
        ok = page.get("ok")
        if isinstance(ok, dict) and "text" in ok:
            return str(ok["text"])
    return str(page)\n'''

# Replace in verify_and_payout
target1 = '''        def analyze_delivery() -> dict:
            try:
                response = gl.nondet.web.get(url)
                raw = response.body.decode("utf-8", errors="replace")
                web_data = raw[:MAX_CONTEXT_LEN]
            except Exception:
                web_data = "ERROR: Failed to fetch the delivery URL. The website might be down, unreachable, or blocking bots."
                
            context = str(web_data)[:MAX_CONTEXT_LEN]'''

replacement1 = '''        def analyze_delivery() -> dict:
            try:
                page = gl.nondet.web.render(url, mode="text")
            except Exception as e:
                raise gl.vm.UserError(f"{ERROR_TRANSIENT} Could not fetch delivery: {e}")
                
            context = _extract_text(page)[:MAX_CONTEXT_LEN]'''

if target1 in content:
    content = content.replace(target1, replacement1)
else:
    print('Failed to find target1')

# Replace in audit_live_project
target2 = '''        def analyze_drift() -> str:
            web_data = ""
            try:
                response = gl.nondet.web.get(url)
                raw = response.body.decode("utf-8", errors="replace")
                web_data = raw[:MAX_CONTEXT_LEN]
            except Exception:
                return {"verdict": "VIOLATED", "reason": "Website unreachable"}
                
            context = str(web_data)[:MAX_CONTEXT_LEN]'''

replacement2 = '''        def analyze_drift() -> dict:
            try:
                page = gl.nondet.web.render(url, mode="text")
            except Exception as e:
                raise gl.vm.UserError(f"{ERROR_TRANSIENT} Could not fetch delivery: {e}")
                
            context = _extract_text(page)[:MAX_CONTEXT_LEN]'''

if target2 in content:
    content = content.replace(target2, replacement2)
else:
    print('Failed to find target2')

with open('contracts/dao.py', 'w') as f:
    f.write(content)
print('Done')
