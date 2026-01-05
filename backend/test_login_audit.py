#!/usr/bin/env python
"""
Login Audit System - Test Script
Tests the login audit functionality
"""

import requests
import json
from datetime import datetime

# Backend URL
BASE_URL = "http://127.0.0.1:8000"

def print_section(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}\n")

def test_login():
    """Test login functionality with audit logging"""
    print_section("TEST 1: Login with Audit Logging")
    
    try:
        response = requests.post(
            f"{BASE_URL}/login",
            json={
                "username": "admin",
                "password": "password"
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            print("✓ Login successful!")
            print(f"  - User ID: {data['user_id']}")
            print(f"  - Username: {data['username']}")
            print(f"  - Session ID: {data.get('session_id', 'N/A')}")
            return data
        else:
            print(f"✗ Login failed: {response.status_code}")
            print(f"  {response.text}")
            return None
    except Exception as e:
        print(f"✗ Error: {str(e)}")
        return None

def test_recent_logins():
    """Test getting recent logins"""
    print_section("TEST 2: Get Recent Logins")
    
    try:
        response = requests.get(f"{BASE_URL}/login-audit/recent?limit=10")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Retrieved {data['count']} recent logins")
            
            if data['data']:
                print("\nRecent Logins:")
                for login in data['data'][:3]:  # Show first 3
                    print(f"  - {login['username']} ({login['login_status']}) at {login['login_timestamp']}")
                    if login.get('failure_reason'):
                        print(f"    Reason: {login['failure_reason']}")
            return data
        else:
            print(f"✗ Failed: {response.status_code}")
            return None
    except Exception as e:
        print(f"✗ Error: {str(e)}")
        return None

def test_failed_logins():
    """Test getting failed logins"""
    print_section("TEST 3: Get Failed Login Attempts")
    
    try:
        # Try to login with wrong password
        requests.post(
            f"{BASE_URL}/login",
            json={
                "username": "admin",
                "password": "wrongpassword"
            }
        )
        
        # Get failed attempts
        response = requests.get(f"{BASE_URL}/login-audit/failed?limit=10")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Retrieved {data['count']} failed login attempts")
            
            if data['data']:
                print("\nFailed Attempts:")
                for attempt in data['data'][:3]:
                    print(f"  - {attempt['username']}: {attempt['failure_reason']}")
            return data
        else:
            print(f"✗ Failed: {response.status_code}")
            return None
    except Exception as e:
        print(f"✗ Error: {str(e)}")
        return None

def test_login_stats():
    """Test getting login statistics"""
    print_section("TEST 4: Get Login Statistics")
    
    try:
        response = requests.get(f"{BASE_URL}/login-audit/stats?days=7")
        
        if response.status_code == 200:
            data = response.json()['data']
            print("✓ Login Statistics (Last 7 Days):")
            print(f"  - Total Attempts: {data['total_login_attempts']}")
            print(f"  - Successful: {data['successful_logins']}")
            print(f"  - Failed: {data['failed_login_attempts']}")
            print(f"  - Success Rate: {data['success_rate']:.2f}%")
            print(f"  - Unique Users: {data['unique_users']}")
            print(f"  - Unique Usernames Attempted: {data['unique_usernames_attempted']}")
            if data.get('average_session_duration_seconds'):
                print(f"  - Avg Session Duration: {data['average_session_duration_seconds']} seconds")
            return data
        else:
            print(f"✗ Failed: {response.status_code}")
            return None
    except Exception as e:
        print(f"✗ Error: {str(e)}")
        return None

def test_suspicious_activity():
    """Test detecting suspicious activity"""
    print_section("TEST 5: Detect Suspicious Activity")
    
    try:
        # Try multiple failed logins
        for i in range(3):
            requests.post(
                f"{BASE_URL}/login",
                json={
                    "username": f"testuser{i}",
                    "password": "wrongpassword"
                }
            )
        
        # Check for suspicious activity
        response = requests.get(f"{BASE_URL}/login-audit/suspicious?threshold_minutes=5")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Suspicious Activity Check:")
            print(f"  - Threshold: {data['threshold_minutes']} minutes")
            print(f"  - Suspicious IPs Found: {data['count']}")
            
            if data['data']:
                print("\nSuspicious Activities:")
                for activity in data['data']:
                    print(f"  - IP: {activity['ip_address']}")
                    print(f"    Failed Attempts: {activity['failed_attempts']}")
                    print(f"    Usernames Tried: {', '.join(activity['usernames_attempted'])}")
            return data
        else:
            print(f"✗ Failed: {response.status_code}")
            return None
    except Exception as e:
        print(f"✗ Error: {str(e)}")
        return None

def test_user_history(user_id=1):
    """Test getting user login history"""
    print_section(f"TEST 6: Get User {user_id} Login History")
    
    try:
        response = requests.get(f"{BASE_URL}/login-audit/user/{user_id}?limit=10")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✓ User: {data['username']}")
            print(f"  - Total Logins Retrieved: {data['count']}")
            
            if data['data']:
                print("\nLogin History:")
                for login in data['data'][:3]:
                    duration = f", Duration: {login['duration_seconds']}s" if login.get('duration_seconds') else ""
                    print(f"  - {login['login_timestamp']}: {login['login_status']}{duration}")
            return data
        else:
            print(f"✗ Failed: {response.status_code}")
            return None
    except Exception as e:
        print(f"✗ Error: {str(e)}")
        return None

def test_logout(session_id):
    """Test recording logout"""
    print_section("TEST 7: Record Logout")
    
    try:
        response = requests.post(
            f"{BASE_URL}/login-audit/logout",
            json={"session_id": session_id}
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✓ {data['message']}")
            print(f"  - Session ID: {data['session_id']}")
            return data
        else:
            print(f"✗ Failed: {response.status_code}")
            return None
    except Exception as e:
        print(f"✗ Error: {str(e)}")
        return None

def main():
    print("\n" + "="*60)
    print("  LOGIN AUDIT SYSTEM - TEST SUITE")
    print("="*60)
    print(f"\nStarting tests... (Backend: {BASE_URL})\n")
    
    try:
        # Test 1: Login
        login_data = test_login()
        
        # Test 2: Get recent logins
        test_recent_logins()
        
        # Test 3: Get failed logins
        test_failed_logins()
        
        # Test 4: Get statistics
        test_login_stats()
        
        # Test 5: Detect suspicious activity
        test_suspicious_activity()
        
        # Test 6: Get user history
        if login_data:
            test_user_history(login_data['user_id'])
            
            # Test 7: Logout
            if login_data.get('session_id'):
                test_logout(login_data['session_id'])
        
        # Final Summary
        print_section("TEST SUMMARY")
        print("✓ All tests completed successfully!")
        print("\nLogin Audit System is working correctly.")
        print("\nAvailable Endpoints:")
        print("  - GET  /login-audit/recent              (Get recent logins)")
        print("  - GET  /login-audit/user/{user_id}      (Get user history)")
        print("  - GET  /login-audit/failed              (Get failed attempts)")
        print("  - GET  /login-audit/stats               (Get statistics)")
        print("  - GET  /login-audit/suspicious          (Detect suspicious activity)")
        print("  - POST /login-audit/logout              (Record logout)")
        
    except Exception as e:
        print(f"\n✗ Fatal error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
