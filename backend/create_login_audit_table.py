#!/usr/bin/env python
"""
Create Login Audit Table
Adds the login_audit table to track all user login attempts and activities
"""

from database import engine, Base
from dbmodel import LoginAudit
import sys

def create_login_audit_table():
    """Create the login_audit table"""
    try:
        print("Creating login_audit table...")
        
        # Create all tables (including LoginAudit)
        Base.metadata.create_all(bind=engine)
        
        print("✓ Login audit table created successfully!")
        print("\nLogin Audit Table Structure:")
        print("- id: Primary key")
        print("- user_id: User ID (NULL for failed logins)")
        print("- username: Username attempted")
        print("- email: User email (if available)")
        print("- login_status: 'SUCCESS' or 'FAILED'")
        print("- failure_reason: Reason for failed login")
        print("- ip_address: Client IP address")
        print("- user_agent: Browser/client info")
        print("- session_id: Unique session identifier")
        print("- login_timestamp: When login occurred")
        print("- logout_timestamp: When user logged out")
        print("- duration_seconds: Session duration in seconds")
        
        return True
    except Exception as e:
        print(f"✗ Error creating login audit table: {str(e)}", file=sys.stderr)
        return False

if __name__ == "__main__":
    success = create_login_audit_table()
    sys.exit(0 if success else 1)
