# Role-Based Access Control (RBAC) Implementation Guide

## Overview
This guide explains how to create role-based users and implement access control in your Government Disbursement Portal.

---

## 1. User Roles

There are 4 predefined roles in the system:

| Role | Description | Access Level |
|------|-------------|--------------|
| **admin** | Full system access | Complete control |
| **manager** | Can manage products and CSV uploads | High level |
| **user** | Can view products and upload CSVs | Standard level |
| **guest** | Limited to login/registration | Minimal level |

---

## 2. Creating Users with Roles

### Method 1: During Registration (Frontend)

When registering a new user, include the role in the request:

```javascript
// frontend/index.js or registration.js
async function registerUser(username, password, role = 'user') {
    try {
        const response = await fetch('http://127.0.0.1:8000/registration', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                password: password,
                role: role  // 'admin', 'manager', 'user', or 'guest'
            })
        });
        
        const result = await response.json();
        if (response.ok) {
            alert(`User registered successfully as ${role}`);
        } else {
            alert('Registration failed: ' + result.detail);
        }
    } catch (error) {
        console.error('Registration error:', error);
    }
}
```

### Method 2: Admin Creating Users (Backend)

Create a new endpoint for admins to create users with specific roles:

```python
# In jwt.py - Add this endpoint
@app.post("/admin/create-user")
async def admin_create_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Only ADMIN users can create new users with specific roles
    """
    # Get current user from token (you'll need to implement JWT authentication)
    # For now, this is a placeholder
    
    # Check if user already exists
    existing_user = db.query(User).filter(User.username == user_data.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    # Create new user with the specified role
    new_user = User(
        username=user_data.username,
        password=user_data.password,  # In production, hash this!
        role=user_data.role or 'user',
        is_active=1
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {
        "id": new_user.id,
        "username": new_user.username,
        "role": new_user.role,
        "message": "User created successfully"
    }
```

### Method 3: Direct Database Insert (For Testing)

Run these SQL commands to create test users:

```sql
-- Create test users with different roles
INSERT INTO "user" (username, password, role, is_active) VALUES
('admin_user', 'admin123', 'admin', 1),
('manager_user', 'manager123', 'manager', 1),
('regular_user', 'user123', 'user', 1),
('guest_user', 'guest123', 'guest', 1);
```

Or in Python:

```python
# In backend/reset_db.py or a separate script
from database import SessionLocal
from dbmodel import User

def create_test_users():
    db = SessionLocal()
    
    # Clear existing users
    db.query(User).delete()
    db.commit()
    
    # Create test users
    test_users = [
        User(username='admin_user', password='admin123', role='admin'),
        User(username='manager_user', password='manager123', role='manager'),
        User(username='regular_user', password='user123', role='user'),
        User(username='guest_user', password='guest123', role='guest'),
    ]
    
    for user in test_users:
        db.add(user)
    
    db.commit()
    print("Test users created successfully!")
    db.close()

if __name__ == "__main__":
    create_test_users()
```

---

## 3. Implementing Role-Based Access Control

### Step 1: Import RBAC in your backend

```python
# In jwt.py - Add these imports
from rbac import Role, Permission, has_permission
from fastapi import Depends, HTTPException, status
```

### Step 2: Create a dependency to get current user with role

```python
# In jwt.py - Add this function
async def get_current_user(request: Request, db: Session = Depends(get_db)):
    """
    Get the current user from the request
    In a real app, you'd extract this from a JWT token
    For now, we'll get it from session/localStorage via frontend
    """
    # This is a simplified version - in production, use JWT tokens
    try:
        # Get user ID from request header or cookie
        user_id = request.headers.get('X-User-ID')
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Not authenticated"
            )
        
        user = db.query(User).filter(User.id == int(user_id)).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
        
        return user
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}"
        )
```

### Step 3: Create a dependency to check permissions

```python
# In jwt.py - Add this function
def require_permission(permission: Permission):
    """
    Dependency that checks if user has the required permission
    """
    async def permission_checker(current_user: User = Depends(get_current_user)):
        user_role = Role(current_user.role)
        
        if not has_permission(user_role, permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied. Required: {permission.value}"
            )
        
        return current_user
    
    return permission_checker
```

### Step 4: Protect Endpoints with Permissions

```python
# In jwt.py - Update endpoints to require permissions

@app.get("/product")
async def get_products(
    current_user: User = Depends(require_permission(Permission.VIEW_PRODUCTS)),
    db: Session = Depends(get_db)
):
    """
    Only users with VIEW_PRODUCTS permission can access this endpoint
    """
    products = db.query(Product).all()
    # ... rest of the code
    return products


@app.post("/product")
async def create_product(
    product: ProductSchema,
    current_user: User = Depends(require_permission(Permission.CREATE_PRODUCT)),
    db: Session = Depends(get_db)
):
    """
    Only users with CREATE_PRODUCT permission can create products
    """
    # ... create product code
    return new_product


@app.delete("/product/{id}")
async def delete_product(
    id: int,
    current_user: User = Depends(require_permission(Permission.DELETE_PRODUCT)),
    db: Session = Depends(get_db)
):
    """
    Only users with DELETE_PRODUCT permission can delete products
    """
    # ... delete product code
    return {"message": "Product deleted"}


@app.post("/csv-upload")
async def csv_upload(
    file: UploadFile,
    current_user: User = Depends(require_permission(Permission.UPLOAD_CSV)),
):
    """
    Only users with UPLOAD_CSV permission can upload files
    """
    # ... CSV upload code
    return result
```

---

## 4. Frontend Implementation

### Update Login to Handle Roles

```javascript
// frontend/login.js
async function handleLogin() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (!username || !password) {
        alert('Please enter username and password');
        return;
    }
    
    try {
        const response = await fetch('http://127.0.0.1:8000/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            // Store user info including role
            localStorage.setItem('userId', result.id);
            localStorage.setItem('username', result.username);
            localStorage.setItem('userRole', result.role);  // NEW: Store role
            
            // Redirect to dashboard
            window.location.href = 'index.html';
        } else {
            alert('Login failed: ' + (result.detail || result.message));
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Error logging in. Check console for details.');
    }
}
```

### Show/Hide Features Based on Role

```javascript
// frontend/index.js
function updateUIBasedOnRole() {
    const userRole = localStorage.getItem('userRole');
    
    // Hide delete button for non-admin users
    if (userRole !== 'admin') {
        document.querySelectorAll('[data-role="admin-only"]').forEach(el => {
            el.style.display = 'none';
        });
    }
    
    // Hide edit button for users
    if (userRole === 'user' || userRole === 'guest') {
        document.querySelectorAll('[data-role="edit-only"]').forEach(el => {
            el.style.display = 'none';
        });
    }
    
    // Show admin features only for admin
    if (userRole === 'admin') {
        document.querySelectorAll('[data-role="admin-feature"]').forEach(el => {
            el.style.display = 'block';
        });
    }
}

// Call this on page load
document.addEventListener('DOMContentLoaded', updateUIBasedOnRole);
```

### Send User ID in API Requests

```javascript
// frontend/index.js - Update fetch calls to include user ID
async function fetchProductsFromDatabase() {
    const userId = localStorage.getItem('userId');
    
    try {
        const response = await fetch('http://127.0.0.1:8000/product', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-User-ID': userId  // NEW: Send user ID
            }
        });
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const products = await response.json();
        return products;
    } catch (error) {
        console.error('Error fetching products:', error);
        alert('Failed to load products');
        return [];
    }
}
```

---

## 5. Testing the RBAC System

### Run the RBAC Test Suite

```bash
cd backend
python rbac.py
```

This will show you:
- All permissions for each role
- Test cases for permission checking
- Permission summary by role

### Test Users for Manual Testing

| Username | Password | Role | Can Do |
|----------|----------|------|---------|
| admin_user | admin123 | admin | Everything |
| manager_user | manager123 | manager | Manage products, upload CSV |
| regular_user | user123 | user | View products, upload CSV |
| guest_user | guest123 | guest | Only login/register |

---

## 6. Permission Hierarchy

```
ADMIN
├── All Product Permissions
├── All CSV Permissions
├── All User Management Permissions
├── All Audit Permissions
└── All Auth Permissions

MANAGER
├── View Products
├── Create Products
├── Edit Products
├── All CSV Permissions
├── View Users (read-only)
├── View Audit Logs (read-only)
└── All Auth Permissions

USER
├── View Products (read-only)
├── CSV Upload
├── Download Error Reports
└── All Auth Permissions

GUEST
├── Login
└── Register
```

---

## 7. Security Considerations

⚠️ **Important for Production:**

1. **Hash Passwords** - Never store plain text passwords
   ```python
   from passlib.context import CryptContext
   
   pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
   
   hashed_password = pwd_context.hash(password)
   ```

2. **Use JWT Tokens** - Replace X-User-ID headers with proper JWT tokens

3. **Validate Roles** - Always validate on the backend, never trust frontend

4. **Audit Logging** - Log who accessed what and when

5. **Rate Limiting** - Prevent brute force attacks

---

## 8. Complete Example: Admin-Only Endpoint

```python
# In jwt.py
from fastapi import FastAPI, Depends, HTTPException, status
from rbac import Permission

@app.post("/admin/manage-users")
async def manage_users(
    user_data: UserCreate,
    current_user: User = Depends(require_permission(Permission.DELETE_USER)),
    db: Session = Depends(get_db)
):
    """
    Only ADMIN users (who have DELETE_USER permission) can access this
    """
    
    # Additional check: Ensure user is actually admin
    if current_user.role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can manage users"
        )
    
    # Process user management request
    # ...
    
    return {"message": "User management successful"}
```

---

## Summary

1. ✅ Updated User model to include `role` field
2. ✅ Updated schemas to support roles
3. ✅ Created RBAC system with 4 roles and 15 permissions
4. ✅ Protect endpoints with permission checks
5. ✅ Display UI elements based on user role
6. ✅ Test with provided test users

**Next Steps:**
- Update your `jwt.py` to implement the endpoint protection
- Test with the provided test users
- Consider adding JWT tokens for production security
