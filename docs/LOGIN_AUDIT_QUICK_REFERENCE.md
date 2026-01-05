# Login Audit System - Quick Reference Guide

## Quick Start

### 1. Initialize the Login Audit System
```bash
cd backend
python create_login_audit_table.py
```

### 2. Automatic Tracking
Login attempts are automatically logged when users login/logout. No additional setup needed!

## Key Features

✅ **Automatic Login Logging** - Every login attempt (success/failure) is logged  
✅ **Session Tracking** - Unique session IDs and duration tracking  
✅ **Security Monitoring** - Detect suspicious activity and failed attempts  
✅ **Statistics** - Generate reports on login patterns  
✅ **Compliance** - Complete audit trail for regulations  

## Database Schema

```
login_audit table
├── id (PRIMARY KEY)
├── user_id (NULLABLE)
├── username
├── email (NULLABLE)
├── login_status (SUCCESS/FAILED)
├── failure_reason (NULLABLE)
├── ip_address (NULLABLE)
├── user_agent (NULLABLE)
├── session_id (NULLABLE)
├── login_timestamp
├── logout_timestamp (NULLABLE)
└── duration_seconds (NULLABLE)
```

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/login-audit/recent` | GET | Get recent login attempts |
| `/login-audit/user/{user_id}` | GET | Get user's login history |
| `/login-audit/failed` | GET | Get failed login attempts |
| `/login-audit/stats` | GET | Get login statistics |
| `/login-audit/suspicious` | GET | Get suspicious activity |
| `/login-audit/logout` | POST | Record logout event |

## Usage Examples

### Get Recent Logins
```bash
curl http://localhost:8000/login-audit/recent?limit=20
```

### Get User Login History
```bash
curl http://localhost:8000/login-audit/user/5?limit=50
```

### Get Failed Attempts
```bash
curl http://localhost:8000/login-audit/failed?limit=20
```

### Get Statistics (Last 7 Days)
```bash
curl http://localhost:8000/login-audit/stats?days=7
```

### Check Suspicious Activity
```bash
curl http://localhost:8000/login-audit/suspicious?threshold_minutes=5
```

### Record Logout
```bash
curl -X POST http://localhost:8000/login-audit/logout \
  -H "Content-Type: application/json" \
  -d '{"session_id":"abc-123-def-456"}'
```

## Python Usage

### Log Login (Automatic in /login endpoint)
```python
from login_audit_manager import LoginAuditManager

LoginAuditManager.log_login_attempt(
    username='john_doe',
    user_id=5,
    email='john@example.com',
    login_status='SUCCESS',
    ip_address='192.168.1.100',
    user_agent='Mozilla/5.0...'
)
```

### Get Login Statistics
```python
from login_audit_manager import LoginAuditManager

stats = LoginAuditManager.get_login_stats(days=7)
print(f"Success rate: {stats['success_rate']}%")
```

### Get User History
```python
history = LoginAuditManager.get_user_login_history(user_id=5, limit=20)
for login in history:
    print(f"{login['login_timestamp']}: {login['login_status']}")
```

### Detect Suspicious Activity
```python
suspicious = LoginAuditManager.get_suspicious_activity(threshold_minutes=5)
```

## What Gets Logged

### On Successful Login
- ✓ User ID
- ✓ Username
- ✓ Email
- ✓ IP Address
- ✓ Browser Info (User Agent)
- ✓ Session ID
- ✓ Login Timestamp

### On Failed Login
- ✓ Username (attempted)
- ✓ Failure Reason (invalid credentials, deactivated, etc)
- ✓ IP Address
- ✓ Browser Info (User Agent)
- ✓ Login Timestamp

### On Logout
- ✓ Logout Timestamp
- ✓ Session Duration (in seconds)

## Files Reference

| File | Purpose |
|------|---------|
| `backend/dbmodel.py` | LoginAudit table definition |
| `backend/login_audit_manager.py` | Login audit manager class |
| `backend/jwt.py` | Updated login endpoint with audit logging |
| `backend/create_login_audit_table.py` | Script to create the table |
| `docs/LOGIN_AUDIT_DOCUMENTATION.md` | Complete documentation |

## Security Features

🔒 **IP Tracking** - Know where logins come from  
🔒 **Brute Force Detection** - Identify attack patterns  
🔒 **Session Management** - Track user sessions  
🔒 **Failure Tracking** - Log reasons for failures  
🔒 **Compliance Audit** - Full audit trail for regulations  

## Common Queries

### Find All Failed Logins
```
GET /login-audit/failed
```

### Find User's Last 10 Logins
```
GET /login-audit/user/5?limit=10
```

### Check For Brute Force Attempts
```
GET /login-audit/suspicious?threshold_minutes=5
```

### Get Weekly Statistics
```
GET /login-audit/stats?days=7
```

## Notes

- Session IDs are unique and returned in login response
- Logout timestamps are recorded when `/login-audit/logout` is called
- Suspicious activity is detected when 3+ failed attempts from same IP in threshold time
- All timestamps are in ISO 8601 format
- IP addresses and user agents help with security analysis

## Integration with Frontend

```javascript
// Store session ID on login
const loginResponse = await fetch('/login', {...});
const { session_id } = await loginResponse.json();
localStorage.setItem('sessionId', session_id);

// Log logout when user leaves
window.addEventListener('beforeunload', () => {
    const sessionId = localStorage.getItem('sessionId');
    fetch('/login-audit/logout', {
        method: 'POST',
        body: JSON.stringify({ session_id: sessionId })
    });
});
```

## Troubleshooting

**Login audit not recording?**
- Ensure `create_login_audit_table.py` was run
- Check backend logs for errors
- Verify database connection

**Session ID not returned?**
- Make sure login endpoint is updated
- Check for exceptions during login

**Can't fetch audit logs?**
- Verify endpoint URLs are correct
- Check CORS settings
- Ensure backend is running

For detailed information, see [LOGIN_AUDIT_DOCUMENTATION.md](LOGIN_AUDIT_DOCUMENTATION.md)
