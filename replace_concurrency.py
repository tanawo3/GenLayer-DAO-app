import os
import re

DAO_PATH = "contracts/dao.py"

with open(DAO_PATH, "r") as f:
    content = f.read()

# 1. Add locked mapping
if "locked: TreeMap[str, bool]" not in content:
    content = content.replace(
        "action_approvers: TreeMap[str, bool]\n    next_action_id: u256",
        "action_approvers: TreeMap[str, bool]\n    next_action_id: u256\n    locked: TreeMap[str, bool]"
    )

# 2. Modify create_proposal
# Find the exact lines to replace
old_create_exec = """        decision = gl.vm.run_nondet_unsafe(analyze, validator_fn)
        
        risk = int(decision["risk_score_bps"])
        summary = decision["summary"]
        plagiarism = decision.get("plagiarism_flag", False)"""

new_create_exec = """        if self.locked.get(id, False):
            raise gl.vm.UserError(f"{ERROR_EXPECTED} Evaluation in progress lock active")
        self.locked[id] = True
        try:
            decision = gl.vm.run_nondet_unsafe(analyze, validator_fn)
        finally:
            self.locked[id] = False
        
        risk = int(decision["risk_score_bps"])
        summary = decision["summary"]
        plagiarism = decision.get("plagiarism_flag", False)"""

content = content.replace(old_create_exec, new_create_exec)

# 3. Modify verify_and_payout
# A. Fix the pickling bug and setup the lock
old_verify_setup = """        url = prop.delivery_url
        desc = prop.description
        
        def analyze_delivery() -> dict:"""

new_verify_setup = """        url = prop.delivery_url
        desc = prop.description
        const = self.constitution
        
        if self.locked.get(id, False):
            raise gl.vm.UserError(f"{ERROR_EXPECTED} Evaluation in progress lock active")
        self.locked[id] = True
        
        def analyze_delivery() -> dict:"""

content = content.replace(old_verify_setup, new_verify_setup)

# B. Fix the prompt in analyze_delivery
old_verify_prompt = """            prompt = f\"\"\"You are an auditor verifying a completed DAO project.
CONSTITUTION:
{self.constitution}

PROPOSAL DESCRIPTION:
{clean_desc}"""

new_verify_prompt = """            prompt = f\"\"\"You are an auditor verifying a completed DAO project.
CONSTITUTION:
{const}

PROPOSAL DESCRIPTION:
{clean_desc}"""

content = content.replace(old_verify_prompt, new_verify_prompt)

# C. Close the try-finally for verify_and_payout
old_verify_exec = """            
        decision = gl.vm.run_nondet_unsafe(analyze_delivery, validator_fn)
        
        verified = decision.get("verified", False)"""

new_verify_exec = """            
        try:
            decision = gl.vm.run_nondet_unsafe(analyze_delivery, validator_fn)
        finally:
            self.locked[id] = False
        
        verified = decision.get("verified", False)"""

content = content.replace(old_verify_exec, new_verify_exec)

# 4. Modify audit_live_project
old_audit_setup = """        url = prop.delivery_url
        desc = prop.description
        proposer_addr = Address(prop.proposer)
        
        def analyze_drift() -> dict:"""

new_audit_setup = """        url = prop.delivery_url
        desc = prop.description
        proposer_addr = Address(prop.proposer)
        
        if self.locked.get(id, False):
            raise gl.vm.UserError(f"{ERROR_EXPECTED} Evaluation in progress lock active")
        self.locked[id] = True
        
        def analyze_drift() -> dict:"""

content = content.replace(old_audit_setup, new_audit_setup)

old_audit_exec = """            
        decision = gl.vm.run_nondet_unsafe(analyze_drift, drift_validator)
        
        verdict = decision.get("verdict", "DRIFTING")"""

new_audit_exec = """            
        try:
            decision = gl.vm.run_nondet_unsafe(analyze_drift, drift_validator)
        finally:
            self.locked[id] = False
        
        verdict = decision.get("verdict", "DRIFTING")"""

content = content.replace(old_audit_exec, new_audit_exec)

with open(DAO_PATH, "w") as f:
    f.write(content)
print("Concurrency features and pickling bug fix injected successfully.")
