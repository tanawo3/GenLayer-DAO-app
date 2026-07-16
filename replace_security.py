import os
import re

DAO_PATH = "contracts/dao.py"

with open(DAO_PATH, "r") as f:
    content = f.read()

# 1. Add hashlib import
if "import hashlib" not in content:
    content = content.replace("import json\nimport re\n", "import json\nimport re\nimport hashlib\n")

# 2. Add helper functions before _NativeRecipient
HELPERS = """
def _sanitize_user_text(s: str, max_len: int) -> str:
    if not s:
        return ""
    truncated = s[:max_len]
    lines = truncated.splitlines()
    cleaned_lines = []
    for line in lines:
        stripped = line.strip()
        lower = stripped.lower()
        if (lower.startswith("ignore") or
            lower.startswith("system:") or
            lower.startswith("user:") or
            lower.startswith("assistant:") or
            stripped.startswith("```") or
            stripped.startswith("###")):
            continue
        cleaned_lines.append(line)
    return "\\n".join(cleaned_lines)

def _generate_canary(proposal_id: str, salt: str = "genlayer_sec") -> str:
    data = f"{proposal_id}_{salt}".encode('utf-8')
    return hashlib.sha256(data).hexdigest()[:8]

@gl.evm.contract_interface"""

if "def _sanitize_user_text" not in content:
    content = content.replace("@gl.evm.contract_interface", HELPERS)

# 3. Update verify_and_payout
# Find the prompt in verify_and_payout
old_leader = """        def leader_fn() -> str:
            try:
                # Fetch delivery content
                render_res = gl.nondet.web.render(url, mode="text")
                web_text = _extract_text(render_res)
            except Exception as e:
                return _handle_leader_error(e)

            prompt = f\"\"\"You are an auditor verifying a completed DAO project.
CONSTITUTION:
{self.constitution}

PROPOSAL DESCRIPTION:
{prop.description}

SUBMITTED DELIVERY CONTENT (from {url}):
<UNTRUSTED_DATA>
{web_text[:MAX_CONTEXT_LEN]}
</UNTRUSTED_DATA>

Check if the delivery fulfills the proposal description.
Return ONLY valid JSON:
{{"status": "APPROVED" or "REJECTED", "summary": "reasoning"}}
\"\"\"
            res = gl.nondet.exec_prompt(prompt, response_format="json")"""

new_leader = """        def leader_fn() -> str:
            try:
                # Fetch delivery content
                render_res = gl.nondet.web.render(url, mode="text")
                web_text = _extract_text(render_res)
            except Exception as e:
                return _handle_leader_error(e)

            # Sanitize untrusted inputs
            clean_desc = _sanitize_user_text(prop.description, MAX_PROPOSAL_LEN)
            clean_web = _sanitize_user_text(web_text, MAX_CONTEXT_LEN)
            canary = _generate_canary(prop.proposal_id)

            prompt = f\"\"\"You are an auditor verifying a completed DAO project.
CONSTITUTION:
{self.constitution}

PROPOSAL DESCRIPTION:
{clean_desc}

SUBMITTED DELIVERY CONTENT (from {url}):
<UNTRUSTED_DATA>
{clean_web}
</UNTRUSTED_DATA>

Check if the delivery fulfills the proposal description.
You MUST include the exact canary token '{canary}' in your JSON output.
Return ONLY valid JSON:
{{"status": "APPROVED" or "REJECTED", "summary": "reasoning", "canary": "{canary}"}}
\"\"\"
            res = gl.nondet.exec_prompt(prompt, response_format="json")"""

content = content.replace(old_leader, new_leader)

# 4. Update verify_and_payout validator
old_val = """        def validator_fn(leader_result: gl.vm.Return) -> bool:
            if not isinstance(leader_result, gl.vm.Return):
                return False
            try:
                data = json.loads(leader_result.calldata)
            except Exception:
                return False
            if "status" not in data or "summary" not in data:
                return False
            if data["status"] not in ["APPROVED", "REJECTED", ERROR_TRANSIENT]:
                return False
            return True"""

new_val = """        def validator_fn(leader_result: gl.vm.Return) -> bool:
            if not isinstance(leader_result, gl.vm.Return):
                return False
            try:
                data = json.loads(leader_result.calldata)
            except Exception:
                return False
            if "status" not in data or "summary" not in data:
                return False
            if data["status"] not in ["APPROVED", "REJECTED", ERROR_TRANSIENT]:
                return False
            
            # Anti-Spoofing / Injection Check
            if data["status"] != ERROR_TRANSIENT:
                expected_canary = _generate_canary(prop.proposal_id)
                if data.get("canary") != expected_canary:
                    return False
                    
            return True"""

content = content.replace(old_val, new_val)

with open(DAO_PATH, "w") as f:
    f.write(content)
print("Security features injected successfully.")
