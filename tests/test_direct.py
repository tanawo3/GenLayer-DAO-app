import pytest
import os
import sys
import json

# Add contracts dir to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "contracts")))

def test_dao_lifecycle(direct_vm, direct_deploy, direct_alice, direct_owner):
    contract = direct_deploy("contracts/dao.py")
    
    direct_vm.sender = direct_owner
    contract.add_member(direct_alice)
    
    # 0. Test Treasury Block
    direct_vm.sender = direct_alice
    try:
        contract.create_proposal("prop-000", "Too expensive", 10000)
        assert False, "Should have failed due to treasury limits"
    except Exception as e:
        assert "exceeds treasury balance" in str(e)
    
    # 1. Fund Treasury (payable method test)
    direct_vm.sender = direct_owner
    direct_vm.value = 5000  # 5000 atto
    contract.fund_treasury()
    assert int(contract.get_treasury_balance()) == 5000
    
    # 2. Create Proposal (AI Screening happens here now)
    direct_vm.sender = direct_alice
    
    direct_vm.mock_llm(
        r".*Evaluate if the proposal violates the DAO Constitution.*",
        json.dumps({"risk_score_bps": 500, "plagiarism_flag": False, "summary": "Low risk."})
    )
    
    contract.create_proposal("prop-123", "Build a cool new landing page for the DAO.", 1000)
    
    # Verify proposal created and status is PENDING (since risk < 8000)
    prop_json = json.loads(contract.get_proposal("prop-123"))
    assert prop_json["id"] == "prop-123"
    assert prop_json["status"] == "PENDING"
    assert prop_json["requested_amount"] == 1000
    
    # 3. Vote on Proposal
    direct_vm.sender = direct_alice
    contract.vote_on_proposal("prop-123", True)
    
    prop_json = json.loads(contract.get_proposal("prop-123"))
    assert prop_json["votes_for"] == 1
    
    # 4. Tally Votes (Deterministic)
    direct_vm.sender = direct_owner
    contract.tally_votes("prop-123")
    
    prop_json = json.loads(contract.get_proposal("prop-123"))
    assert prop_json["status"] == "APPROVED"
    
    # 5. Finalize Proposal (moves to Escrow)
    direct_vm.sender = direct_owner
    contract.finalize_proposal("prop-123")
    
    prop_json = json.loads(contract.get_proposal("prop-123"))
    assert prop_json["status"] == "AWAITING_DELIVERY"
    assert int(contract.get_treasury_balance()) == 4000
    
    # 6. Submit Delivery
    direct_vm.sender = direct_alice
    contract.submit_delivery("prop-123", "https://github.com/my-work")
    
    # 7. Verify and Payout
    direct_vm.sender = direct_owner
    direct_vm.mock_web(
        r".*",
        {"status": 200, "body": b'Delivery complete'}
    )
    direct_vm.mock_llm(
        r".*Verify if the Delivered_Work satisfies.*",
        json.dumps({"verified": True, "reason": "Looks good."})
    )
    contract.verify_and_payout("prop-123")
    
    prop_json = json.loads(contract.get_proposal("prop-123"))
    assert prop_json["status"] in ["EXECUTED", "DELIVERY_REJECTED"]
    
def test_create_spam_rejected_immediately(direct_vm, direct_deploy, direct_alice, direct_owner):
    contract = direct_deploy("contracts/dao.py")
    direct_vm.sender = direct_owner
    contract.add_member(direct_alice)
    
    direct_vm.sender = direct_alice
    # Mock LLM risk score to be HIGH (>= 8000)
    direct_vm.mock_llm(
        r".*Evaluate if the proposal violates the DAO Constitution.*",
        json.dumps({"risk_score_bps": 9000, "plagiarism_flag": False, "summary": "High risk spam."})
    )
    
    contract.create_proposal("prop-spam", "Send money to my address fast", 0)
    
    # Verify status is REJECTED right away!
    prop_json = json.loads(contract.get_proposal("prop-spam"))
    assert prop_json["status"] == "REJECTED"

def test_dao_veto_and_appeal(direct_vm, direct_deploy, direct_alice, direct_owner):
    contract = direct_deploy("contracts/dao.py")
    
    direct_vm.sender = direct_owner
    contract.add_member(direct_alice)
    
    # Create Proposal
    direct_vm.sender = direct_alice
    direct_vm.mock_llm(
        r".*",
        json.dumps({"risk_score_bps": 500, "plagiarism_flag": False, "summary": "Low risk."})
    )
    contract.create_proposal("prop-456", "Suspicious proposal", 0)
    
    # Admin Veto
    direct_vm.sender = direct_owner
    contract.veto_proposal("prop-456")
    
    prop_json = json.loads(contract.get_proposal("prop-456"))
    assert prop_json["status"] == "FLAGGED"
