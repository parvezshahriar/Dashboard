# Login Audit System Documentation

## Overview

The Login Audit System tracks all user login attempts (both successful and failed) with detailed information including timestamps, IP addresses, user agents, and session information. This enables monitoring of user access patterns, detecting security threats, and maintaining compliance audits.

## Database Table Structure

### `login_audit` Table

```sql
- id (INTEGER, PRIMARY KEY)
  Unique identifier for each login audit record

- user_id (INTEGER, NULLABLE, INDEXED)
  User ID of the logged-in user (NULL for failed logins)

- username (STRING, INDEXED)
  Username that was used for login attempt

- email (STRING, NULLABLE, INDEXED)
  User's email address (if available)

- login_status (STRING, INDEXED)
  'SUCCESS' for successful logins
  'FAILED' for failed login attempts

- failure_reason (STRING, NULLABLE)
  Reason for failed login (e.g., "Invalid credentials", "Account deactivated")

- ip_address (STRING, NULLABLE)
  Client's IP address

- user_agent (STRING, NULLABLE)
  Browser/client user agent information

- session_id (STRING, NULLABLE, INDEXED)
  Unique session identifier for tracking session duration

- login_timestamp (DATETIME, INDEXED)
  When the login attempt occurred (default: NOW())

- logout_timestamp (DATETIME, NULLABLE)
  When the user logged out (NULL if still logged in)

- duration_seconds (INTEGER, NULLABLE)
  Session duration in seconds (calculated on logout)
```

## Features

### 1. Automatic Login Logging
Every login attempt is automatically logged with:
- Username and user ID (when applicable)
- Login status (SUCCESS or FAILED)
- Failure reason for failed attempts
- Client IP address
- User agent/browser information
- Precise timestamp

### 2. Session Tracking
- Unique session ID generated for each successful login
- Session duration calculated and stored on logout
- Helps track concurrent sessions and usage patterns

### 3. Security Monitoring
- Track failed login attempts
- Detect suspicious activity (multiple failed logins from same IP)
- Identify deactivated account access attempts
- Monitor login patterns by user

### 4. Statistics and Analytics
- Generate login statistics for any time period
- Calculate success rates
- Identify unique users and attempted usernames
- Calculate average session duration

## API Endpoints

### Get Recent Login Attempts
```http
GET /login-audit/recent?limit=50
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
      "logout_timestamp": null,
      "duration_seconds": null,
      "session_id": "abc-123-def-456"
    }
  ]
}
```

### Get User Login History
```http
GET /login-audit/user/{user_id}?limit=50
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

### Get Failed Login Attempts
```http
GET /login-audit/failed?limit=50
```

**Response:**
```json
{
  "status": "success",
  "count": 3,
  "data": [
    {
      "id": 2,
      "username": "invalid_user",
      "failure_reason": "Invalid credentials",
      "ip_address": "192.168.1.101",
      "login_timestamp": "2026-01-04T14:30:22"
    }
  ]
}
```

### Get Login Statistics
```http
GET /login-audit/stats?days=7
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "period_days": 7,
    "total_login_attempts": 150,
    "successful_logins": 145,
    "failed_login_attempts": 5,
    "success_rate": 96.67,
    "unique_users": 25,
    "unique_usernames_attempted": 27,
    "average_session_duration_seconds": 3600
  }
}
```

### Get Suspicious Activity
```http
GET /login-audit/suspicious?threshold_minutes=5
```

**Response:**
```json
{
  "status": "success",
  "count": 1,
  "threshold_minutes": 5,
  "data": [
    {
      "ip_address": "192.168.1.150",
      "failed_attempts": 5,
      "usernames_attempted": ["user1", "user2", "admin"],
      "latest_attempt": "2026-01-04T14:35:00"
    }
  ]
}
```

### Record Logout
```http
POST /login-audit/logout
Content-Type: application/json

{
  "session_id": "abc-123-def-456"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Logout recorded successfully",
  "session_id": "abc-123-def-456"
}
```

## Login Flow with Audit

### Successful Login
1. User submits login credentials
2. Backend validates credentials
3. Backend validates user is active
4. **LoginAuditManager.log_login_attempt()** called with:
   - `login_status = 'SUCCESS'`
   - User ID and email populated
   - Session ID generated
5. Session ID returned to client
6. Client stores session ID for logout

### Failed Login
1. User submits login credentials
2. Backend validates credentials
3. If invalid credentials:
   - **LoginAuditManager.log_login_attempt()** called with:
     - `login_status = 'FAILED'`
     - `failure_reason = 'Invalid credentials'`
     - User ID is NULL
4. If account deactivated:
   - **LoginAuditManager.log_login_attempt()** called with:
     - `login_status = 'FAILED'`
     - `failure_reason = 'Account deactivated'`

### Logout
1. Client calls `/login-audit/logout` with session ID
2. **LoginAuditManager.log_logout()** called
3. Logout timestamp recorded
4. Session duration calculated

## Usage Examples

### Python - Log a Login Attempt
```python
from login_audit_manager import LoginAuditManager

# Log successful login
LoginAuditManager.log_login_attempt(
    username='john_doe',
    user_id=5,
    email='john@example.com',
    login_status='SUCCESS',
    ip_address='192.168.1.100',
    user_agent='Mozilla/5.0...'
)

# Log failed login
LoginAuditManager.log_login_attempt(
    username='invalid_user',
    login_status='FAILED',
    failure_reason='Invalid credentials',
    ip_address='192.168.1.101',
    user_agent='Mozilla/5.0...'
)
```

### Python - Query Login Statistics
```python
from login_audit_manager import LoginAuditManager

# Get stats for last 7 days
stats = LoginAuditManager.get_login_stats(days=7)
print(f"Success rate: {stats['success_rate']}%")
print(f"Total attempts: {stats['total_login_attempts']}")

# Get user's login history
history = LoginAuditManager.get_user_login_history(user_id=5, limit=20)
for login in history:
    print(f"{login['login_timestamp']}: {login['login_status']}")

# Detect suspicious activity
suspicious = LoginAuditManager.get_suspicious_activity(threshold_minutes=5)
for activity in suspicious:
    print(f"Warning: {activity['failed_attempts']} failed attempts from {activity['ip_address']}")
```

### JavaScript - Frontend Logout Handling
```javascript
// On logout
async function logout(sessionId) {
    try {
        const response = await fetch('/login-audit/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ session_id: sessionId })
        });
        
        const data = await response.json();
        console.log('Logout recorded:', data.message);
        
        // Clear local session storage
        localStorage.removeItem('sessionId');
        localStorage.removeItem('userId');
        
        // Redirect to login
        window.location.href = '/login.html';
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// On login
async function login(username, password) {
    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (data.session_id) {
            // Store session ID for logout
            localStorage.setItem('sessionId', data.session_id);
            localStorage.setItem('userId', data.user_id);
        }
        
        return data;
    } catch (error) {
        console.error('Login error:', error);
    }
}
```

## Setup

### 1. Create the Login Audit Table
```bash
cd backend
python create_login_audit_table.py
```

### 2. Restart the Backend Server
The login audit system will automatically log all login attempts.

### 3. Access the Audit Logs
Use the API endpoints to view login audit logs and statistics.

## Security Considerations

1. **IP Address Tracking**: Helps identify unusual login locations
2. **Brute Force Detection**: Monitor failed attempts from same IP
3. **Session Management**: Track concurrent sessions and session duration
4. **Compliance**: Complete audit trail for regulatory requirements
5. **Data Privacy**: Email addresses tracked but not exposed in frontend by default

## Performance Tips

1. **Archival**: Archive old login records (> 90 days) to a separate table
2. **Indexing**: IP address and timestamp indexes help with suspicious activity queries
3. **Retention Policy**: Define how long to keep login audit records
4. **Batch Operations**: For reports, use date range filters

## Monitoring and Alerts

Recommend setting up alerts for:
- More than 5 failed login attempts from same IP in 5 minutes
- Login from unusual geographic locations
- Login at unusual times
- Multiple concurrent sessions for same user
- Logins after account deactivation

## Future Enhancements

1. Geographic IP lookup integration
2. Device fingerprinting
3. Multi-factor authentication (MFA) tracking
4. Login risk scoring
5. Automated alert system
6. Data retention policies
7. Export to SIEM systems
