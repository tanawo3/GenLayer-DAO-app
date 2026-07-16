# GenLayer DAO

A decentralized autonomous organization built on **GenLayer**, an Intelligent Blockchain. Instead of relying solely on token-weighted voting for every proposal, this DAO introduces an **AI Constitution Guard**. Proposals are evaluated preemptively by Intelligent Validator Nodes against the DAO's immutable Constitution. 

## The Concept: AI Constitution Guard

The GenLayer protocol allows intelligent contracts to execute non-deterministic AI logic (`gl.nondet.exec_prompt`), followed by an equivalence principle (`gl.eq_principle.prompt_comparative`) to enforce consensus among network validators.

1. **Submission**: A user submits a proposal requesting DAO funds.
2. **AI Evaluation**: The Lead Validator runs the proposal through an LLM prompt containing the DAO's Constitution (Rules against scams, disproportionate enrichment, etc.).
3. **Consensus**: Other validators verify the AI's conclusion. If subjective consensus is reached on the reasoning and decision (ACCEPT/REJECT), the GenLayer Intelligent Contract transitions the state.
4. **Execution**: The proposal is marked as `ACTIVE` (ready for voting) or `REJECTED` (blocked from voting), saving the DAO from spam or misaligned funds.

## Architecture

- **Frontend**: React + Vite + TailwindCSS. Uses the `genlayer-js` SDK to communicate with the GenLayer network.
- **Backend/Intelligent Contract**: Python (`contracts/dao.py`). Follows the GenLayer intelligent contract paradigm.

## Development

```bash
npm install
npm run dev
```
