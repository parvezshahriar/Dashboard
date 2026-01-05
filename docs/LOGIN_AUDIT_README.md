# Login Audit System - Complete Guide

## What Is It?

A comprehensive system that tracks all user login attempts, manages user sessions, and provides security monitoring capabilities. Every login (successful or failed) is recorded with detailed metadata including:
- Timestamp
- IP Address
- Browser/Client Information
- Session ID (for successful logins)
- Failure Reasons (for failed attempts)

## Why You Need It

✅ **Security Monitoring** - Detect unauthorized access attempts  
✅ **Compliance** - Maintain audit trail for regulations (GDPR, HIPAA, SOC 2)  
✅ **Incident Investigation** - Trace when security incidents occurred  
✅ **Brute Force Detection** - Identify and block attack patterns  
✅ **User Behavior Analysis** - Understand user access patterns  
✅ **Session Management** - Track active sessions and duration  

## Quick Start (5 Minutes)

### Step 1: Create the Database Table
```bash
cd backend
python create_login_audit_table.py
```

Output:
```
✓ Login audit table created successfully!
```

### Step 2: Restart the Backend
```bash
python run_api.py
```

### Step 3: Test It Works
```bash
# Try logging in
curl -X POST http://localhost:8000/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'

# Check the logs
curl http://localhost:8000/login-audit/recent
```

That's it! Login tracking is now active.

## What Gets Logged

### Successful Login Example
```json
{
  "id": 1,
  "username": "john_doe",
  "user_id": 5,
  "email": "john@example.com",
  "login_status": "SUCCESS",
  "ip_address": "192.168.1.100",
  "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "login_timestamp": "2026-01-04T14:32:55",
  "logout_timestamp": "2026-01-04T14:45:30",
  "duration_seconds": 815
}
```

### Failed Login Example
```json
{
  "id": 2,
  "username": "attacker",
  "user_id": null,
  "login_status": "FAILED",
  "failure_reason": "Invalid credentials",
  "ip_address": "203.0.113.45",
  "user_agent": "curl/7.68.0",
  "login_timestamp": "2026-01-04T14:30:22"
}
```

## Core Features

### 1. Automatic Login Logging
Every login attempt is automatically tracked in the database. No additional setup needed beyond the initial table creation.

### 2. Session Management
- Unique session IDs generated for successful logins
- Session duration calculated on logout
- Useful for tracking concurrent sessions

### 3. Security Monitoring
- Track failed login attempts
- Identify brute force attacks (3+ failed attempts from same IP)
- Monitor deactivated account access attempts
- Log system errors during login

### 4. Comprehensive Statistics
Generate reports on:
- Success/failure rates
- Unique users and attempted usernames
- Average session duration
- Login trends over time

## API Endpoints

### 1. Get Recent Logins
**Endpoint:** `GET /login-audit/recent`

**Query Parameters:**
- `limit` (optional, default=50) - Number of records to return

**Example:**
```bash
curl http://localhost:8000/login-audit/recent?limit=20
```

**Response:**
```json
{
  "status": "success",
  "count": 5,
  "data": [
    {
      "id": 1,
      "username": "john_doe",
      "user_id": 5,
      "email": "john@example.com",
      "login_status": "SUCCESS",
      "ip_address": "192.168.1.100",
      "login_timestamp": "2026-01-04T14:32:55",
      "session_id": "550e8400-e29b-41d4-a716-446655440000"
    }
  ]
}
```

### 2. Get User Login History
**Endpoint:** `GET /login-audit/user/{user_id}`

**Query Parameters:**
- `limit` (optional, default=50) - Number of records to return

**Example:**
```bash
curl http://localhost:8000/login-audit/user/5?limit=20
```

**Response:**
```json
{
  "status": "success",
  "user_id": 5,
  "username": "john_doe",
  "count": 10,
  "data": [...]
}
```

### 3. Get Failed Login Attempts
**Endpoint:** `GET /login-audit/failed`

**Query Parameters:**
- `limit` (optional, default=50) - Number of records to return

**Example:**
```bash
curl http://localhost:8000/login-audit/failed?limit=20
```

**Response:**
```json
{
  "status": "success",
  "count": 3,
  "data": [
    {
      "id": 2,
      "username": "attacker",
      "failure_reason": "Invalid credentials",
      "ip_address": "203.0.113.45",
      "login_timestamp": "2026-01-04T14:30:22"
    }
  ]
}
```

### 4. Get Login Statistics
**Endpoint:** `GET /login-audit/stats`

**Query Parameters:**
- `days` (optional, default=7) - Number of days to analyze

**Example:**
```bash
curl http://localhost:8000/login-audit/stats?days=30
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "period_days": 30,
    "total_login_attempts": 500,
    "successful_logins": 480,
    "failed_login_attempts": 20,
    "success_rate": 96.0,
    "unique_users": 45,
    "unique_usernames_attempted": 50,
    "average_session_duration_seconds": 1800
  }
}
```

### 5. Get Suspicious Activity
**Endpoint:** `GET /login-audit/suspicious`

**Query Parameters:**
- `threshold_minutes` (optional, default=5) - Time window for detection

**Example:**
```bash
curl http://localhost:8000/login-audit/suspicious?threshold_minutes=5
```

**Response:**
```json
{
  "status": "success",
  "count": 1,
  "threshold_minutes": 5,
  "data": [
    {
      "ip_address": "203.0.113.100",
      "failed_attempts": 7,
      "usernames_attempted": ["admin", "user", "test", "root"],
      "latest_attempt": "2026-01-04T14:40:00"
    }
  ]
}
```

### 6. Record Logout
**Endpoint:** `POST /login-audit/logout`

**Request Body:**
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Example:**
```bash
curl -X POST http://localhost:8000/login-audit/logout \
  -H "Content-Type: application/json" \
  -d '{"session_id":"550e8400-e29b-41d4-a716-446655440000"}'
```

**Response:**
```json
{
  "status": "success",
  "message": "Logout recorded successfully",
  "session_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

## Frontend Integration

### Store Session ID on Login
```javascript
async function login(username, password) {
    const response = await fetch('http://localhost:8000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    
    if (data.session_id) {
        // Store session ID
        localStorage.setItem('sessionId', data.session_id);
        localStorage.setItem('userId', data.user_id);
    }
    
    return data;
}
```

### Record Logout
```javascript
async function logout() {
    const sessionId = localStorage.getItem('sessionId');
    
    if (sessionId) {
        // Record logout
        await fetch('http://localhost:8000/login-audit/logout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: sessionId })
        });
    }
    
    // Clear storage
    localStorage.removeItem('sessionId');
    localStorage.removeItem('userId');
    
    // Redirect to login
    window.location.href = '/login.html';
}

// Record logout on page unload
window.addEventListener('beforeunload', logout);
```

### Display Login History
```javascript
async function showLoginHistory(userId) {
    const response = await fetch(
        `http://localhost:8000/login-audit/user/${userId}`
    );
    
    const data = await response.json();
    
    console.log(`${data.username}'s Login History:`);
    data.data.forEach(login => {
        console.log(`${login.login_timestamp}: ${login.login_status}`);
        if (login.duration_seconds) {
            console.log(`  Duration: ${login.duration_seconds} seconds`);
        }
    });
}
```

## Python Integration

### Query Login Data Programmatically
```python
from login_audit_manager import LoginAuditManager

# Get recent logins
recent = LoginAuditManager.get_recent_logins(limit=20)
for login in recent:
    print(f"{login['username']}: {login['login_status']}")

# Get user's history
history = LoginAuditManager.get_user_login_history(user_id=5)
for login in history:
    print(f"{login['login_timestamp']}: {login['login_status']}")

# Get statistics
stats = LoginAuditManager.get_login_stats(days=7)
print(f"Success rate: {stats['success_rate']}%")

# Detect suspicious activity
suspicious = LoginAuditManager.get_suspicious_activity(threshold_minutes=5)
for activity in suspicious:
    print(f"Alert: {activity['failed_attempts']} failed attempts from {activity['ip_address']}")
```

## Database Table Structure

```sql
CREATE TABLE login_audit (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,  -- NULL for failed logins
    username VARCHAR NOT NULL,
    email VARCHAR,
    login_status VARCHAR NOT NULL,  -- SUCCESS or FAILED
    failure_reason VARCHAR,
    ip_address VARCHAR,
    user_agent VARCHAR,
    session_id VARCHAR,
    login_timestamp DATETIME NOT NULL,
    logout_timestamp DATETIME,
    duration_seconds INTEGER
);

-- Indexes for performance
CREATE INDEX idx_user_id ON login_audit(user_id);
CREATE INDEX idx_username ON login_audit(username);
CREATE INDEX idx_login_status ON login_audit(login_status);
CREATE INDEX idx_ip_address ON login_audit(ip_address);
CREATE INDEX idx_session_id ON login_audit(session_id);
CREATE INDEX idx_login_timestamp ON login_audit(login_timestamp);
```

## Security Best Practices

### 1. Monitoring
- Check suspicious activity regularly
- Set up alerts for multiple failed attempts
- Monitor logins from unusual locations

### 2. Data Retention
- Archive old records (>90 days) to archive tables
- Keep critical records for compliance
- Delete records per data retention policy

### 3. Access Control
- Restrict audit log viewing to admins
- Log who accesses audit logs
- Never expose sensitive data in logs

### 4. Integration
- Export logs to SIEM systems
- Set up real-time alerts
- Create dashboards for monitoring

## Use Cases

### Case 1: Investigating a Security Incident
```bash
# Get all failed attempts from suspicious IP
curl "http://localhost:8000/login-audit/failed" | jq '.data[] | select(.ip_address == "203.0.113.45")'

# Get user's login history
curl http://localhost:8000/login-audit/user/5
```

### Case 2: Monitoring for Brute Force Attacks
```bash
# Check for suspicious activity
curl http://localhost:8000/login-audit/suspicious

# If found, block the IP address in your firewall
```

### Case 3: Compliance Reporting
```bash
# Generate report for auditors
curl "http://localhost:8000/login-audit/stats?days=90"

# Export all logins for a period
curl http://localhost:8000/login-audit/recent?limit=10000
```

### Case 4: User Account Review
```bash
# Check when user last logged in
curl http://localhost:8000/login-audit/user/5?limit=1

# Verify no unauthorized access attempts
curl http://localhost:8000/login-audit/failed | grep "user5"
```

## Troubleshooting

### Issue: Login audit not recording
**Solution:**
```bash
# 1. Verify table exists
python backend/create_login_audit_table.py

# 2. Check backend logs
tail -f logs/backend.log

# 3. Restart backend
python backend/run_api.py
```

### Issue: Can't fetch audit logs
**Solution:**
```bash
# 1. Verify backend is running
curl http://localhost:8000/users

# 2. Check CORS settings (should allow all origins)

# 3. Verify database connection
python -c "from database import engine; engine.connect().execute('SELECT 1')"
```

### Issue: Session ID not returned
**Solution:**
- Verify jwt.py was updated with new login code
- Check backend logs for errors
- Restart backend server

## Testing

Run the test suite:
```bash
python backend/test_login_audit.py
```

This will:
1. Test successful login with audit logging
2. Retrieve recent logins
3. Log failed attempts
4. Generate statistics
5. Detect suspicious activity
6. Get user login history
7. Record logout

## Files Reference

| File | Purpose |
|------|---------|
| `backend/dbmodel.py` | LoginAudit table definition |
| `backend/login_audit_manager.py` | Manager class for audit operations |
| `backend/jwt.py` | Updated login endpoint |
| `backend/create_login_audit_table.py` | Table creation script |
| `backend/test_login_audit.py` | Test suite |
| `docs/LOGIN_AUDIT_DOCUMENTATION.md` | Complete technical documentation |
| `docs/LOGIN_AUDIT_QUICK_REFERENCE.md` | Quick reference guide |
| `docs/LOGIN_AUDIT_IMPLEMENTATION.md` | Implementation details |

## Next Steps

1. ✅ Create database table
2. ✅ Restart backend
3. ✅ Test login functionality
4. → Integrate logout tracking in frontend
5. → Set up monitoring dashboard
6. → Configure alerts for suspicious activity
7. → Create audit reports for compliance

## Support

For detailed API documentation, see [LOGIN_AUDIT_DOCUMENTATION.md](LOGIN_AUDIT_DOCUMENTATION.md)

For quick reference, see [LOGIN_AUDIT_QUICK_REFERENCE.md](LOGIN_AUDIT_QUICK_REFERENCE.md)

For implementation details, see [LOGIN_AUDIT_IMPLEMENTATION.md](LOGIN_AUDIT_IMPLEMENTATION.md)
