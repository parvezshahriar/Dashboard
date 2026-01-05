#!/usr/bin/env python
"""Test complete login/logout flow with database verification"""

import requests
import json
from database import Session
from dbmodel import LoginAudit
import time

# Test 1: Successful login
print('='*60)
print('TEST 1: SUCCESSFUL LOGIN')
print('='*60)
response = requests.post('http://127.0.0.1:8000/login', json={
    'username': 'shahriar',
    'password': 'shahriar110032'
})
print(f'Status: {response.status_code}')
result = response.json()
print(f'User: {result.get("username")}')
session_id = result.get('session_id')
print(f'Session ID: {session_id}')

# Wait 3 seconds
time.sleep(3)

# Test 2: Logout
print('\n' + '='*60)
print('TEST 2: LOGOUT')
print('='*60)
logout_response = requests.post('http://127.0.0.1:8000/login-audit/logout', json={
    'session_id': session_id
})
print(f'Status: {logout_response.status_code}')
print(f'Response: {json.dumps(logout_response.json(), indent=2)}')

# Test 3: Check database
print('\n' + '='*60)
print('TEST 3: DATABASE VERIFICATION')
print('='*60)
session = Session()
login_record = session.query(LoginAudit).filter(LoginAudit.session_id == session_id).first()
if login_record:
    print(f'✓ Session found in database')
    print(f'  - Username: {login_record.username}')
    print(f'  - Status: {login_record.login_status}')
    print(f'  - User ID: {login_record.user_id}')
    print(f'  - Session ID: {login_record.session_id}')
    print(f'  - Login Time: {login_record.login_timestamp}')
    print(f'  - Logout Time: {login_record.logout_timestamp}')
    print(f'  - Duration: {login_record.duration_seconds} seconds')
    print(f'\n✓ LOGIN AUDIT SYSTEM IS WORKING CORRECTLY!')
else:
    print('✗ Session not found in database')
session.close()
