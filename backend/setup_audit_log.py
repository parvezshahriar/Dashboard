#!/usr/bin/env python
"""
Script to initialize the audit log system with triggers
Run this after create_tables.py to set up audit logging
"""

from audit_log import setup_audit_system

def main():
    """Initialize the audit log system"""
    print("\n" + "="*60)
    print("AUDIT LOG SYSTEM INITIALIZATION")
    print("="*60)
    
    success = setup_audit_system()
    
    if success:
        print("\n" + "="*60)
        print("SUCCESS: Audit log system is ready!")
        print("="*60)
        print("\nThe following tables now have audit logging:")
        print("  1. user - Track user account changes")
        print("  2. product_1 - Track product/payment data changes")
        print("  3. batch_upload - Track batch operation changes")
        print("  4. user_info - Track user profile changes")
        print("\nAll INSERT, UPDATE, and DELETE operations are logged automatically.")
        print("Query audit_log table for change history.\n")
        return True
    else:
        print("\n" + "="*60)
        print("ERROR: Failed to initialize audit log system")
        print("="*60 + "\n")
        return False

if __name__ == "__main__":
    import sys
    success = main()
    sys.exit(0 if success else 1)
