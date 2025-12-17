# RBAC Users Setup Guide

## Overview
This guide explains how to use the three RBAC users created in the system with their specific permissions.

---

## Setup Instructions

### Step 1: Create RBAC Users
Run this command in the backend directory:

```bash
cd backend
python create_rbac_users.py
```

Output:
```
======================================================================
RBAC USER CREATION SCRIPT
======================================================================

[INFO] Cleared existing test users
[CREATED] ADMIN user: admin / admin123
          Access: Full access to all features
[CREATED] MANAGER user: manager / manager123
          Access: Can edit products and upload CSV only
[CREATED] USER user: user / user123
          Access: View-only access

[SUCCESS] All RBAC users created successfully!

======================================================================
RBAC TEST USERS - LOGIN CREDENTIALS
======================================================================

1. ADMIN USER
   Username: admin
   Password: admin123
   Access: ✓ Create/Edit/Delete Products
           ✓ Upload CSV Files
           ✓ View All Data
           ✓ Manage Users (Future)
           ✓ View Audit Logs (Future)

2. MANAGER USER
   Username: manager
   Password: manager123
   Access: ✓ Edit Products Only
           ✓ Upload CSV Files
           ✓ View Products
           ✗ Create Products
           ✗ Delete Products
           ✗ Manage Users

3. USER (VIEWER)
   Username: user
   Password: user123
   Access: ✓ View Products
           ✓ Search Products
           ✗ Create Products
           ✗ Edit Products
           ✗ Delete Products
           ✗ Upload CSV
======================================================================
```

---

## User Roles & Permissions

### 1. ADMIN User
**Username:** `admin`  
**Password:** `admin123`

#### Features Available:
✅ **Product Management**
- View all products
- Create new products
- Edit existing products
- Delete products

✅ **CSV Operations**
- Upload CSV files
- View validation reports
- Download error reports
- Process valid rows

✅ **Future Features (Admin Only)**
- Manage users
- View audit logs
- Export reports

#### Restricted Actions:
- None (full access)

---

### 2. MANAGER User
**Username:** `manager`  
**Password:** `manager123`

#### Features Available:
✅ **Product Management**
- View products
- Edit products only

✅ **CSV Operations**
- Upload CSV files
- View validation reports
- Download error reports
- Process valid rows

#### Restricted Actions:
❌ Create products
❌ Delete products
❌ Manage users
❌ View audit logs

**Use Case:** Product managers who can update existing data and import new data via CSV, but cannot create products directly or delete critical data.

---

### 3. USER (Viewer)
**Username:** `user`  
**Password:** `user123`

#### Features Available:
✅ **View Only**
- View all products
- Search products
- Filter by date range
- Pagination

#### Restricted Actions:
❌ Create products
❌ Edit products
❌ Delete products
❌ Upload CSV files

**Use Case:** Reports viewers, stakeholders, or regular employees who only need to see product data but cannot modify it.

---

## Frontend Implementation

### Update Login to Store User Role
The login endpoint now returns the user's role:

```javascript
// frontend/login.js
async function handleLogin() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
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
            localStorage.setItem('userId', result.id);
            localStorage.setItem('username', result.username);
            localStorage.setItem('userRole', result.role);  // NEW
            
            window.location.href = 'index.html';
        }
    } catch (error) {
        alert('Login error: ' + error);
    }
}
```

### Show/Hide Features Based on Role
Update `frontend/index.js` to hide/disable features:

```javascript
// Show/hide UI elements based on user role
function updateUIBasedOnRole() {
    const userRole = localStorage.getItem('userRole');
    
    // Admin: Show all buttons
    if (userRole === 'admin') {
        // All features visible
        document.querySelector('[data-feature="create"]').style.display = 'block';
        document.querySelector('[data-feature="edit"]').style.display = 'block';
        document.querySelector('[data-feature="delete"]').style.display = 'block';
        document.querySelector('[data-feature="csv"]').style.display = 'block';
    }
    
    // Manager: Show edit and CSV only
    else if (userRole === 'manager') {
        document.querySelector('[data-feature="create"]').style.display = 'none';
        document.querySelector('[data-feature="edit"]').style.display = 'block';
        document.querySelector('[data-feature="delete"]').style.display = 'none';
        document.querySelector('[data-feature="csv"]').style.display = 'block';
    }
    
    // User: Show view only
    else if (userRole === 'user') {
        document.querySelector('[data-feature="create"]').style.display = 'none';
        document.querySelector('[data-feature="edit"]').style.display = 'none';
        document.querySelector('[data-feature="delete"]').style.display = 'none';
        document.querySelector('[data-feature="csv"]').style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', updateUIBasedOnRole);
```

### Send User ID with API Requests
Update all API calls to include user_id:

```javascript
// Update fetch calls to include user_id
async function fetchProductsFromDatabase() {
    const userId = localStorage.getItem('userId');
    
    const response = await fetch('http://127.0.0.1:8000/product' + 
        (userId ? `?user_id=${userId}` : ''), {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });
    
    return await response.json();
}

// For PUT/DELETE requests
async function updateProduct(id, data) {
    const userId = localStorage.getItem('userId');
    
    const response = await fetch(
        `http://127.0.0.1:8000/product/${id}?user_id=${userId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });
    
    return await response.json();
}

// For CSV upload
async function uploadCSVFile(file) {
    const userId = localStorage.getItem('userId');
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(
        `http://127.0.0.1:8000/csv-upload?user_id=${userId}`, {
        method: 'POST',
        body: formData
    });
    
    return await response.json();
}
```

---

## Testing the RBAC System

### Test 1: Admin User
1. Login as `admin` / `admin123`
2. Verify all features are visible and working
3. Try creating, editing, and deleting products
4. Verify CSV upload works
5. All operations should succeed ✅

### Test 2: Manager User
1. Login as `manager` / `manager123`
2. Verify you can see all products
3. Try to edit a product → Should succeed ✅
4. Try to create a new product → Should fail ❌
5. Try to delete a product → Should fail ❌
6. Try to upload CSV → Should succeed ✅

### Test 3: User (Viewer)
1. Login as `user` / `user123`
2. Verify you can see all products
3. Try to edit a product → Should fail ❌
4. Try to create a new product → Should fail ❌
5. Try to delete a product → Should fail ❌
6. Try to upload CSV → Should fail ❌

---

## Backend API Changes

### Query Parameter
All endpoints now accept optional `user_id` query parameter for permission checking:

```
GET    /product?user_id=1
PUT    /product/{id}?user_id=1
DELETE /product/{id}?user_id=1
POST   /csv-upload?user_id=1
POST   /upload-batch?user_id=1
```

### Permission Errors
If a user doesn't have permission:

```json
{
    "detail": "Permission denied. You need 'edit_product' access"
}
```

### Response Example (Login)
```json
{
    "message": "Login successful",
    "id": 1,
    "username": "admin",
    "role": "admin"
}
```

---

## RBAC Permission Matrix

| Feature | Admin | Manager | User |
|---------|-------|---------|------|
| View Products | ✅ | ✅ | ✅ |
| Create Products | ✅ | ❌ | ❌ |
| Edit Products | ✅ | ✅ | ❌ |
| Delete Products | ✅ | ❌ | ❌ |
| Upload CSV | ✅ | ✅ | ❌ |
| View Reports | ✅ | ✅ | ❌ |
| Manage Users | ✅ | ❌ | ❌ |
| View Audit Logs | ✅ | ❌ | ❌ |

---

## Running the System

```bash
# Terminal 1: Reset database and start backend
cd backend
python reset_db.py
python create_rbac_users.py
uvicorn jwt:app --reload --host 127.0.0.1 --port 8000

# Terminal 2: Start frontend
cd frontend
python -m http.server 3000

# Browser
# http://localhost:3000/login.html
```

---

## Security Notes

⚠️ **For Production:**

1. **Never store plain text passwords** - Hash with bcrypt/argon2
2. **Use JWT tokens** - Instead of user_id in query parameters
3. **HTTPS only** - Encrypt all communications
4. **Database encryption** - Encrypt sensitive data at rest
5. **Audit logging** - Log all permission checks
6. **Rate limiting** - Prevent brute force attacks

---

## Summary

✅ Three users created with specific roles
✅ Permission checks implemented on backend
✅ Frontend can show/hide features based on role
✅ RBAC system fully functional
✅ Easy to extend with new permissions

**Next Steps:**
1. Run `create_rbac_users.py` to create the users
2. Update frontend to send `user_id` with requests
3. Update frontend to show/hide UI based on role
4. Test each user with different operations
