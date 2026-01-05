# Login Audit System - Detailed Documentation

## Overview
The Login Audit System tracks all user login attempts, sessions, and authentication events in real-time with detailed per-user analytics.

---

## 1. Database Schema

### LoginAudit Table Structure
```sql
CREATE TABLE login_audit (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES "user"(id),
    username VARCHAR NOT NULL,
    email VARCHAR,
    login_status VARCHAR NOT NULL,  -- 'SUCCESS' or 'FAILED'
    failure_reason VARCHAR,         -- NULL for successful logins
    ip_address VARCHAR,
    user_agent VARCHAR,
    session_id VARCHAR UNIQUE,
    login_timestamp DATETIME DEFAULT NOW(),
    logout_timestamp DATETIME,
    duration_seconds INTEGER,
    description TEXT,
    INDEX idx_user_id (user_id),
    INDEX idx_username (username),
    INDEX idx_login_status (login_status),
    INDEX idx_session_id (session_id)
);
```

### Key Fields Explained
| Field | Type | Purpose |
|-------|------|---------|
| `id` | INT | Unique identifier for each login attempt |
| `user_id` | INT | Reference to user table (NULL if login failed) |
| `username` | VARCHAR | Username attempted |
| `email` | VARCHAR | User email (if available) |
| `login_status` | VARCHAR | 'SUCCESS' or 'FAILED' |
| `failure_reason` | VARCHAR | Why login failed (invalid credentials, account locked, etc.) |
| `ip_address` | VARCHAR | Client IP address for geolocation tracking |
| `user_agent` | VARCHAR | Browser/Device information |
| `session_id` | VARCHAR | Unique session token |
| `login_timestamp` | DATETIME | When login occurred |
| `logout_timestamp` | DATETIME | When session ended (NULL if still active) |
| `duration_seconds` | INT | Session duration in seconds |
| `description` | TEXT | Additional context or notes |

---

## 2. Per-User Login Audit Features

### A. User Login History
Track all login attempts for a specific user:
- Successful logins with duration
- Failed login attempts
- Login patterns (time of day, frequency)
- Device/IP address changes
- Session tracking

### B. User Session Analytics
- Current active sessions
- Average session duration
- Login frequency per day/week/month
- Concurrent sessions
- Idle time detection

### C. Security Monitoring (Per-User)
- Brute force detection (3+ failures in 5 minutes)
- Unusual login times
- New device/IP alerts
- Failed login patterns
- Account lockout tracking

### D. Login Activity Reports
- Weekly login summary
- Geographic login distribution
- Device login breakdown
- Login success rate trends
- Account status changes

---

## 3. API Endpoints

### Get Recent Logins
```
GET /login-audit/recent?limit=50&status=SUCCESS
```
Response:
```json
[
  {
    "id": 1,
    "user_id": 5,
    "username": "john_doe",
    "login_status": "SUCCESS",
    "ip_address": "192.168.1.1",
    "login_timestamp": "2026-01-05T10:30:00",
    "duration_seconds": 3600
  }
]
```

### Get User Login History
```
GET /login-audit/user/{user_id}?limit=20
```
Returns all login attempts for a specific user.

### Get Failed Login Attempts
```
GET /login-audit/failed?days=7&limit=50
```
Returns failed login attempts in the past 7 days.

### Get Suspicious Activity
```
GET /login-audit/suspicious?threshold=3&window=5
```
Returns potential brute force attacks (3+ failures in 5 minutes).

### Get User Statistics
```
GET /login-audit/stats/{user_id}?days=30
```
Returns login statistics for a user over 30 days.

### Get Login by Session
```
GET /login-audit/session/{session_id}
```
Returns details of a specific session.

---

## 4. Backend Implementation

### LoginAuditManager Methods

#### `log_login_attempt()`
Logs a login attempt (successful or failed)
```python
LoginAuditManager.log_login_attempt(
    username="john_doe",
    user_id=5,
    email="john@example.com",
    login_status="SUCCESS",
    ip_address="192.168.1.1",
    user_agent="Mozilla/5.0..."
)
```

#### `get_recent_logins()`
Retrieves recent logins with optional filtering
```python
LoginAuditManager.get_recent_logins(
    limit=50,
    status="SUCCESS"  # or "FAILED"
)
```

#### `get_user_logins()`
Gets all logins for a specific user
```python
LoginAuditManager.get_user_logins(
    user_id=5,
    limit=20,
    days=30
)
```

#### `get_failed_attempts()`
Gets failed login attempts
```python
LoginAuditManager.get_failed_attempts(
    days=7,
    limit=50
)
```

#### `detect_brute_force()`
Detects potential brute force attacks
```python
LoginAuditManager.detect_brute_force(
    threshold=3,        # 3 failed attempts
    time_window=300,    # within 5 minutes
    days=7
)
```

#### `get_user_statistics()`
Gets statistics for a specific user
```python
LoginAuditManager.get_user_statistics(
    user_id=5,
    days=30
)
```

---

## 5. Per-User Login Audit Dashboard

### Dashboard Sections

#### A. User Profile Section
- User ID & Name
- Email address
- Last login time
- Account status
- Creation date

#### B. Current Session
- Session ID
- Login time
- Duration
- IP address
- Device/Browser
- Location (estimated)

#### C. Login Statistics (30 days)
- Total logins: X
- Successful logins: X
- Failed logins: X
- Success rate: X%
- Average session duration: X minutes
- Unique devices: X
- Unique IP addresses: X

#### D. Login Timeline
- Interactive graph showing logins over time
- Color coding: Green (success), Red (failed)
- Hover for details

#### E. Recent Login History
- Table with last 20 logins
- Columns: Date/Time, Status, Duration, IP, Device
- Action buttons: View Details, Block Device

#### F. Devices & Locations
- List of devices used for login
- IP addresses and geolocation
- Last login from each device
- Trust/Block device options

#### G. Security Alerts
- Brute force attempts detected
- New device login alerts
- Unusual login times
- Multiple concurrent sessions
- Account lockout events

#### H. Login Activity Report
- Daily login count
- Weekly trends
- Monthly statistics
- Peak login hours
- Most used devices
- Most common locations

---

## 6. Key Metrics per User

```
Daily Active Users (DAU)
├─ Login Count
├─ Unique Users
└─ Average Session Duration

User Session Metrics
├─ Current Active Sessions
├─ Total Sessions (30 days)
├─ Average Session Length
└─ Longest Session

User Security Metrics
├─ Failed Login Attempts
├─ Successful Login Attempts
├─ Success Rate (%)
├─ Brute Force Events
└─ Account Lockouts

User Device Metrics
├─ Total Devices Used
├─ Device Types (Desktop, Mobile, Tablet)
├─ Operating Systems
├─ Browsers
└─ Device Trust Status

User Location Metrics
├─ Unique IP Addresses
├─ Geographic Locations
├─ Location Change Frequency
└─ New Location Alerts
```

---

## 7. Security Features

### Brute Force Detection
```
Rule: If user has 3+ failed logins within 5 minutes
Action: Temporary account lock (15 minutes)
Alert: Email notification to user
```

### Suspicious Login Detection
```
Rule: Login from new IP address after 30 days
Rule: Login at unusual time (3 AM)
Rule: Multiple concurrent sessions (>2)
Action: Require additional verification
Alert: Email notification to user
```

### Session Management
```
Features:
- Session timeout (30 minutes of inactivity)
- Single session per user option
- Concurrent session limit
- Device trust management
- Session revocation option
```

---

## 8. Frontend Per-User Login Audit Page

### Page Features

1. **User Selector**
   - Dropdown or search to select user
   - Current user highlighted
   - Quick access to favorite users

2. **Key Metrics Cards**
   - Total Logins (30 days)
   - Success Rate
   - Average Session Duration
   - Last Login Time

3. **Activity Timeline**
   - Visual timeline of logins
   - Success/Failure color coding
   - Hover for quick details
   - Click for full details modal

4. **Login Details Table**
   - Date/Time
   - Status (Success/Failed)
   - Duration
   - IP Address
   - Device/Browser
   - Location
   - Actions (View, Block, Trust)

5. **Device Management**
   - List of trusted devices
   - Add device to whitelist
   - Block suspicious devices
   - Device geolocation

6. **Security Dashboard**
   - Failed login attempts chart
   - Login hours heatmap
   - IP address map
   - Device distribution pie chart

7. **Activity Filters**
   - Date range picker
   - Status filter (All, Success, Failed)
   - Device filter
   - IP address search
   - Location filter

---

## 9. Data Export

### Export Options
- CSV export (last 30/90/180 days)
- PDF report generation
- Excel with charts
- JSON API endpoint

### Report Types
- User login report
- Security incident report
- Device usage report
- Monthly activity summary

---

## 10. Integration Points

### With Authentication System
- Automatic logging on login/logout
- Integration with JWT tokens
- Session tracking
- Password change detection

### With User Management
- User creation tracking
- Account status changes
- Role change logging
- Permission modification tracking

### With Email System
- Alert notifications
- Security notifications
- Session summaries
- Weekly digest

### With Admin Dashboard
- User activity overview
- System-wide statistics
- Alert aggregation
- Bulk user management

---

## 11. Database Queries Examples

### Get User's Last 10 Logins
```sql
SELECT * FROM login_audit 
WHERE user_id = 5 
ORDER BY login_timestamp DESC 
LIMIT 10;
```

### Get Failed Logins Last 7 Days
```sql
SELECT * FROM login_audit 
WHERE login_status = 'FAILED' 
AND login_timestamp >= NOW() - INTERVAL '7 days'
ORDER BY login_timestamp DESC;
```

### Detect Brute Force
```sql
SELECT username, COUNT(*) as attempts, 
       MIN(login_timestamp) as first_attempt,
       MAX(login_timestamp) as last_attempt
FROM login_audit 
WHERE login_status = 'FAILED'
AND login_timestamp >= NOW() - INTERVAL '5 minutes'
GROUP BY username
HAVING COUNT(*) >= 3;
```

### User Login Statistics
```sql
SELECT 
    user_id,
    COUNT(*) as total_logins,
    SUM(CASE WHEN login_status='SUCCESS' THEN 1 ELSE 0 END) as successful,
    SUM(CASE WHEN login_status='FAILED' THEN 1 ELSE 0 END) as failed,
    AVG(duration_seconds) as avg_duration
FROM login_audit 
WHERE login_timestamp >= NOW() - INTERVAL '30 days'
GROUP BY user_id;
```

---

## 12. Configuration

### Environment Variables
```bash
LOGIN_AUDIT_ENABLED=true
BRUTE_FORCE_THRESHOLD=3
BRUTE_FORCE_WINDOW=300  # 5 minutes
SESSION_TIMEOUT=1800    # 30 minutes
MAX_CONCURRENT_SESSIONS=3
ALERT_UNUSUAL_LOGIN=true
```

---

## 13. Future Enhancements

- [ ] Machine Learning for anomaly detection
- [ ] Geographic clustering for location analysis
- [ ] Device fingerprinting
- [ ] Risk scoring system
- [ ] Two-factor authentication tracking
- [ ] OAuth/SAML login tracking
- [ ] Login velocity analysis
- [ ] Real-time alerting dashboard

