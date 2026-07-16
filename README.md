# ⚖️ GenLayer DAO

A decentralized autonomous organization built on **GenLayer**, an Intelligent Blockchain. Instead of relying solely on token-weighted voting for every proposal, this DAO introduces an **AI Constitution Guard**, **Automated Delivery Payouts**, and **Continuous Scope Drift Auditing**.

## 🚀 The Ultimate AI Governance Protocol

### 1. The AI Constitution Guard (`create_proposal`)
- **Preemptive Filtering**: When a user submits a proposal requesting DAO funds, the Lead Validator runs the proposal through an LLM prompt containing the DAO's immutable Constitution.
- **Deep Web Fact-Checking (`gl.nondet.web.get`)**: The GenVM Intelligent Contract autonomously browses the web to cross-reference claims (e.g., catching scammers claiming to be "Ethereum founders").
- **Consensus**: If validators reach subjective consensus on the AI's reasoning (ACCEPT/REJECT), the proposal is marked `ACTIVE` or blocked entirely.

### 2. Automated Delivery Verification & Payout (`submit_delivery` & `verify_and_payout`)
- Developers don't need manual community votes to get paid for milestones.
- They submit a live URL of their shipped product. The GenVM AI visits the URL, reads the deployed code/site, verifies it matches the original proposal, and natively transfers the GEN bounty via `.payable` interfaces if successful.

### 3. Continuous Scope Drift Auditing (`audit_live_project`)
- Protects the treasury *after* funding. 
- The AI continuously checks the live project's website and compares it to the original proposal to detect "Scope Creep" or rug pulls, slashing reputation or freezing funds if a drift is detected.

### 4. Dynamic Constitution Amendments (`amend_constitution`)
- The community can vote to update the DAO's core rules. Once passed, the AI's system prompt is permanently updated on-chain to reflect the new societal norms of the DAO.

### 5. Multi-Sig Admin Controls
- Secure `propose_admin_action` and `approve_admin_action` functions ensure that critical DAO parameters are protected by a decentralized moderation council.

### 6. Awwwards-Tier Web3 Frontend
- Built using premium Web3 Brutalist design principles.
- Features dynamic Framer Motion animations, glitch effects, neon borders, strict dark modes (`#050505`), and Lenis smooth scrolling for a world-class user experience.

## 🧠 Architecture

- **Frontend**: React + Vite + TailwindCSS + Framer Motion. Uses the `genlayer-js` SDK to communicate with the GenLayer network.
- **Backend/Intelligent Contract**: Python (`contracts/dao.py`). Follows the GenLayer intelligent contract paradigm, using `DynArray` and `TreeMap` for strict deterministic storage.

## 🛠️ Setup & Development

1. Clone the repository and install dependencies:
```bash
npm install
```
2. Make sure GenLayer Studio / Simulator is running.
3. Run the development server:
```bash
npm run dev
```
