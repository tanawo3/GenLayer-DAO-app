import re

with open(r"C:\Users\omarb\Desktop\genlayer\pending_projects\GenLayer-DAO-app\contracts\dao.py", "r") as f:
    code = f.read()

new_create_proposal = r"""    @gl.public.write
    def create_proposal(self, id: str, description: str, requested_amount: int) -> bool:
        sender = str(gl.message.sender_address)
        if not self.members.get(sender, False):
            raise gl.vm.UserError(f"{ERROR_EXPECTED} Only members can create proposals")
        if id in self.proposals:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} Proposal already exists")
        if requested_amount > 0 and requested_amount > int(self.state.treasury_balance):
            raise gl.vm.UserError(f"{ERROR_EXPECTED} Requested amount exceeds treasury balance")
            
        clean_desc = _deep_sanitize(description)[:MAX_PROPOSAL_LEN]
        appeal_reason = ""
        const = self.constitution
        
        def analyze() -> str:
            url = _extract_url(clean_desc)
            context = clean_desc
            if url:
                try:
                    web_data = gl.nondet.web.get(url, mode="text") or ""
                    context = str(web_data)[:MAX_CONTEXT_LEN]
                    lower = context.lower()
                    for marker in ["cloudflare", "ddos protection", "are you human", "captcha"]:
                        if marker in lower:
                            raise Exception(f"challenge page detected: {marker}")
                except Exception as e:
                    if "challenge page" in str(e):
                        raise gl.vm.UserError(f"{ERROR_EXTERNAL} challenge page detected")
            
            prompt = _interpret_leader_prompt(clean_desc, appeal_reason, context, const)
            raw_analysis = gl.nondet.exec_prompt(prompt, response_format="json")
            
            analysis = {}
            if isinstance(raw_analysis, dict):
                analysis = raw_analysis
            else:
                text = str(raw_analysis)
                # FIX JSON PARSING: Strip markdown blocks
                text = re.sub(r'```json', '', text, flags=re.IGNORECASE)
                text = re.sub(r'```', '', text)
                text = re.sub(r'(\d|true|false|"|\]|\})\s*(")', r'\g<1>, \g<2>', text)
                first = text.find("{")
                last = text.rfind("}")
                if first != -1 and last != -1:
                    try:
                        analysis = json.loads(text[first:last + 1])
                    except:
                        analysis = {}
                        
            return json.dumps({
                "risk_score_bps": _parse_ratio_bps(analysis),
                "summary": _clean_summary(analysis),
                "plagiarism_flag": analysis.get("plagiarism_flag", False)
            })
            
        def validator_fn(leader_res: gl.vm.Result) -> bool:
            if not isinstance(leader_res, gl.vm.Return):
                return _handle_leader_error(leader_res, analyze)
            try:
                mine_str = analyze()
                mine = json.loads(mine_str)
                ld_data = json.loads(leader_res.calldata)
            except Exception:
                return False
                
            if not isinstance(ld_data.get("risk_score_bps"), int):
                return False
                
            # Strict boolean check for plagiarism
            if bool(ld_data.get("plagiarism_flag", False)) != bool(mine.get("plagiarism_flag", False)):
                return False
                
            # Dynamic tolerance check for risk score (from Master Patterns)
            mine_score = int(mine.get("risk_score_bps", 0))
            ld_score = int(ld_data.get("risk_score_bps", 0))
            if abs(ld_score - mine_score) > max(1500, (15 * max(ld_score, mine_score)) // 100):
                return False
                
            return True

        decision_str = gl.vm.run_nondet_unsafe(analyze, validator_fn)
        decision = json.loads(decision_str)
        
        risk = int(decision["risk_score_bps"])
        summary = decision["summary"]
        plagiarism = decision.get("plagiarism_flag", False)
        
        status = "PENDING"
        if risk >= 8000 or plagiarism:
            status = "REJECTED"
            self.state.total_rejected = u256(int(self.state.total_rejected) + 1)
        
        prop = Proposal(
            proposal_id=id,
            proposer=str(gl.message.sender_address),
            description=clean_desc,
            status=status,
            ai_summary=summary,
            risk_score=u256(risk),
            votes_for=u256(0),
            votes_against=u256(0),
            vote_count=u256(0),
            votes_json="[]",
            requested_amount=u256(requested_amount),
            appeal_reason="",
            delivery_url="",
            delivery_summary="",
            created_at_ts=""
        )
        self.proposals[id] = prop
        self.proposal_ids.append(id)
        
        if status == "PENDING":
            self.state.total_proposals = u256(int(self.state.total_proposals) + 1)
        self._recalculate_global_risk()
        return True"""

new_tally_votes = r"""    @gl.public.write
    def tally_votes(self, id: str) -> bool:
        self._require_owner()
        if id not in self.proposals:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} Proposal not found")
            
        prop = self.proposals[id]
        if prop.status not in ["PENDING", "APPEALED"]:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} Not pending or appealed")
            
        v_for = int(prop.votes_for)
        v_against = int(prop.votes_against)
        
        if v_for > v_against:
            prop.status = "APPROVED"
            self.state.total_approved = u256(int(self.state.total_approved) + 1)
        else:
            prop.status = "REJECTED"
            self.state.total_rejected = u256(int(self.state.total_rejected) + 1)
                
        self.proposals[id] = prop
        return True"""

old_create = re.search(r'    @gl\.public\.write\n    def create_proposal.*?return True', code, flags=re.DOTALL).group(0)
old_tally = re.search(r'    @gl\.public\.write\n    def tally_votes.*?return True', code, flags=re.DOTALL).group(0)

code = code.replace(old_create, new_create_proposal)
code = code.replace(old_tally, new_tally_votes)

with open(r"C:\Users\omarb\Desktop\genlayer\pending_projects\GenLayer-DAO-app\contracts\dao.py", "w") as f:
    f.write(code)

print("Replacement successful")
