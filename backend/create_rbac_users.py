"""
Create RBAC test users for the Government Disbursement Portal

Users created:
1. Admin - admin123 - Full access to all features
2. Manager - manager123 - Can only edit products and upload CSV
3. User - user123 - View-only access
"""

from database import Session
from dbmodel import User
from sqlalchemy import text

def create_rbac_users():
    """Create test users with different RBAC roles"""
    
    db = Session()
    
    try:
        # Clear existing test users
        db.query(User).filter(User.username.in_(['admin', 'manager', 'user'])).delete()
        db.commit()
        print("[INFO] Cleared existing test users")
    except Exception as e:
        print(f"[WARNING] Could not clear existing users: {e}")
        db.rollback()
    
    # Define test users
    test_users = [
        {
            'username': 'admin',
            'password': 'admin123',
            'role': 'admin',
            'description': 'Full access to all features'
        },
        {
            'username': 'manager',
            'password': 'manager123',
            'role': 'manager',
            'description': 'Can edit products and upload CSV only'
        },
        {
            'username': 'user',
            'password': 'user123',
            'role': 'user',
            'description': 'View-only access'
        }
    ]
    
    # Create users
    try:
        for user_data in test_users:
            user = User(
                username=user_data['username'],
                password=user_data['password'],
                role=user_data['role'],
                is_active=1
            )
            db.add(user)
            print(f"[CREATED] {user_data['role'].upper()} user: {user_data['username']} / {user_data['password']}")
            print(f"          Access: {user_data['description']}")
        
        db.commit()
        print("\n[SUCCESS] All RBAC users created successfully!\n")
        
        # Display summary
        print("=" * 70)
        print("RBAC TEST USERS - LOGIN CREDENTIALS")
        print("=" * 70)
        print("\n1. ADMIN USER")
        print("   Username: admin")
        print("   Password: admin123")
        print("   Access: ✓ Create/Edit/Delete Products")
        print("           ✓ Upload CSV Files")
        print("           ✓ View All Data")
        print("           ✓ Manage Users (Future)")
        print("           ✓ View Audit Logs (Future)")
        
        print("\n2. MANAGER USER")
        print("   Username: manager")
        print("   Password: manager123")
        print("   Access: ✓ Edit Products Only")
        print("           ✓ Upload CSV Files")
        print("           ✓ View Products")
        print("           ✗ Create Products")
        print("           ✗ Delete Products")
        print("           ✗ Manage Users")
        
        print("\n3. USER (VIEWER)")
        print("   Username: user")
        print("   Password: user123")
        print("   Access: ✓ View Products")
        print("           ✓ Search Products")
        print("           ✗ Create Products")
        print("           ✗ Edit Products")
        print("           ✗ Delete Products")
        print("           ✗ Upload CSV")
        print("=" * 70)
        
    except Exception as e:
        print(f"[ERROR] Failed to create users: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    print("\n" + "=" * 70)
    print("RBAC USER CREATION SCRIPT")
    print("=" * 70 + "\n")
    create_rbac_users()
