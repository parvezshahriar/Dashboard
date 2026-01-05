import requests
import json

# Test data
test_payload = {
    "rows": [
        {
            "EFTREFNUMBER": "TESTUPLOAD001",
            "CRACCOUNTTITLE": "Test Account",
            "CRACCOUNTTYPE": "Checking",
            "CRACCOUNTNO": "1234567890",
            "CRROUTINGNO": "123456789",
            "CRAMOUNT": 5000.00,
            "BENEFICIARY_ID": "BEN001",
            "MOBILE": "01700000001",
            "NID_NO": "12345678901234",
            "MIN_CODE": "MIN001",
            "DEPT_CODE": "DEPT001",
            "PAYMENT_CYCLE_NAME_EN": "Monthly",
            "SCHEME_CODE": "SCH001"
        }
    ]
}

# Test the endpoint
try:
    print("[TEST] Sending batch upload request...")
    response = requests.post(
        "http://127.0.0.1:8000/upload-batch?user_id=5",
        json=test_payload,
        headers={"Content-Type": "application/json"}
    )
    
    print(f"[TEST] Status Code: {response.status_code}")
    result = response.json()
    
    print("[TEST] Response:")
    print(json.dumps(result, indent=2))
    
    if response.status_code == 200:
        print("\n✓ SUCCESS: Batch upload is working!")
    else:
        print("\n✗ ERROR: Upload failed")
        
except Exception as e:
    print(f"[TEST] Error: {e}")
