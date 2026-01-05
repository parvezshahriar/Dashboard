# Login Audit System - Architecture & Flow Diagrams

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  (HTML/JS in /login.html)                                   │
│  ┌──────────────────┐         ┌──────────────────┐          │
│  │ Login Form       │         │ Logout Button    │          │
│  └────────┬─────────┘         └────────┬─────────┘          │
│           │                            │                     │
│           │ POST /login               │ POST /logout        │
│           │ + sessionId                │ + sessionId         │
└───────────┼────────────────────────────┼────────────────────┘
            │                            │
            ▼                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (jwt.py)                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ @app.post('/login')                                 │  │
│  │ 1. Extract IP, User Agent                           │  │
│  │ 2. Validate credentials                             │  │
│  │ 3. Check if user is active                          │  │
│  │ 4. Call LoginAuditManager.log_login_attempt()       │  │
│  │ 5. Return session_id to client                      │  │
│  └────────────────┬─────────────────────────────────────┘  │
│                   │                                          │
│                   ▼                                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ @app.post('/login-audit/logout')                    │  │
│  │ 1. Receive session_id                               │  │
│  │ 2. Call LoginAuditManager.log_logout()              │  │
│  │ 3. Update logout_timestamp & duration_seconds       │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ LOGIN AUDIT MANAGER (login_audit_manager.py)        │  │
│  │                                                      │  │
│  │  Methods:                                           │  │
│  │  • log_login_attempt()                             │  │
│  │  • log_logout()                                    │  │
│  │  • get_recent_logins()                             │  │
│  │  • get_user_login_history()                        │  │
│  │  • get_failed_login_attempts()                     │  │
│  │  • get_login_stats()                               │  │
│  │  • get_suspicious_activity()                       │  │
│  └────────────────┬─────────────────────────────────────┘  │
│                   │                                          │
│                   ▼                                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ QUERY ENDPOINTS                                     │  │
│  │ • /login-audit/recent                              │  │
│  │ • /login-audit/user/{id}                           │  │
│  │ • /login-audit/failed                              │  │
│  │ • /login-audit/stats                               │  │
│  │ • /login-audit/suspicious                          │  │
│  └────────────────┬─────────────────────────────────────┘  │
└───────────────────┼──────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│                     DATABASE                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ login_audit Table                                   │  │
│  │ ┌───────────────────────────────────────────────┐   │  │
│  │ │ id                                            │   │  │
│  │ │ user_id          (INDEXED)                    │   │  │
│  │ │ username         (INDEXED)                    │   │  │
│  │ │ email                                         │   │  │
│  │ │ login_status     (INDEXED) SUCCESS|FAILED     │   │  │
│  │ │ failure_reason   (nullable)                   │   │  │
│  │ │ ip_address       (INDEXED)                    │   │  │
│  │ │ user_agent                                    │   │  │
│  │ │ session_id       (INDEXED)                    │   │  │
│  │ │ login_timestamp  (INDEXED)                    │   │  │
│  │ │ logout_timestamp (nullable)                   │   │  │
│  │ │ duration_seconds (nullable)                   │   │  │
│  │ └───────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Login Flow

```
User               Frontend            Backend             Database
 │                   │                  │                    │
 │─── Visits Page ──▶│                  │                    │
 │                   │                  │                    │
 │◀────Display Form──│                  │                    │
 │                   │                  │                    │
 │─ Enters Creds ───▶│                  │                    │
 │                   │                  │                    │
 │                   │──POST /login────▶│                    │
 │                   │   username       │                    │
 │                   │   password       │──Check Creds──────▶│
 │                   │                  │◀──User Found───────│
 │                   │                  │                    │
 │                   │                  │◀─ Valid ✓ ────────│
 │                   │                  │                    │
 │                   │                  │──LogLoginAttempt──▶│
 │                   │                  │ (SUCCESS, IP, UA)  │◀─ Save & Return
 │                   │                  │                    │  session_id
 │                   │◀─Response────────│                    │
 │                   │ sessionId        │                    │
 │                   │ userId           │                    │
 │                   │ username         │                    │
 │◀─Display Home────│                  │                    │
 │ (logged in)       │                  │                    │
 │                   │                  │                    │
 │── Uses App ──────▶│                  │                    │
 │    (5 mins)       │                  │                    │
 │                   │                  │                    │
 │─ Clicks Logout ──▶│                  │                    │
 │                   │                  │                    │
 │                   │──POST /logout───▶│                    │
 │                   │ sessionId        │──UpdateLogout─────▶│
 │                   │                  │ (timestamp, dur)   │◀─ Updated
 │                   │◀─Response────────│                    │
 │                   │                  │                    │
 │◀─Redirects────────│                  │                    │
 │ (to login page)   │                  │                    │
```

## Failed Login Flow

```
User               Frontend            Backend             Database
 │                   │                  │                    │
 │─── Visits Page ──▶│                  │                    │
 │                   │                  │                    │
 │◀────Display Form──│                  │                    │
 │                   │                  │                    │
 │─ Wrong Creds ────▶│                  │                    │
 │                   │                  │                    │
 │                   │──POST /login────▶│                    │
 │                   │   username       │                    │
 │                   │   password       │──Check Creds──────▶│
 │                   │                  │◀──User Found───────│
 │                   │                  │                    │
 │                   │                  │◀─ Invalid ✗ ──────│
 │                   │                  │                    │
 │                   │                  │──LogLoginAttempt──▶│
 │                   │                  │ (FAILED, IP, UA)   │◀─ Save with
 │                   │                  │ failure_reason     │  failure reason
 │                   │◀─401 Error───────│                    │
 │                   │ "Invalid Creds"  │                    │
 │                   │                  │                    │
 │◀─Error Message────│                  │                    │
```

## Suspicious Activity Detection

```
Attacker            Frontend/Tool       Backend             Database
                        │                  │                    │
 ──────────────────────▶│                  │                    │
 Failed Login #1        │──POST /login────▶│                    │
 (IP: 203.0.113.50)     │                  │──Log Attempt──────▶│
                        │◀─401 Error───────│                    ││
 ──────────────────────▶│                  │                    │ Save
 Failed Login #2        │──POST /login────▶│                    │
 (IP: 203.0.113.50)     │                  │──Log Attempt──────▶│
                        │◀─401 Error───────│                    ││
 ──────────────────────▶│                  │                    │
 Failed Login #3        │──POST /login────▶│                    │
 (IP: 203.0.113.50)     │                  │──Log Attempt──────▶│
                        │◀─401 Error───────│                    ││
                        │                  │                    │
 [3+ FAILURES DETECTED] │                  │                    │
                        │                  │                    │
        Admin           │                  │                    │
         │              │                  │                    │
         │◀────────────────/login-audit/suspicious──────────────│
         │              │                  │                    │
         │ Gets Alert:  │                  │                    │
         │ • IP: 203... │                  │                    │
         │ • Count: 3   │                  │                    │
         │ • Users: ... │                  │                    │
```

## Statistics Report

```
Admin Dashboard
   │
   ▼
GET /login-audit/stats?days=7
   │
   ▼
LoginAuditManager.get_login_stats()
   │
   ├─ Query all logins from last 7 days
   │
   ├─ Calculate:
   │  ├─ Total login attempts
   │  ├─ Successful count
   │  ├─ Failed count
   │  ├─ Success rate %
   │  ├─ Unique users
   │  ├─ Unique usernames attempted
   │  └─ Average session duration
   │
   ▼
Return JSON:
{
  "period_days": 7,
  "total_login_attempts": 150,
  "successful_logins": 145,
  "failed_login_attempts": 5,
  "success_rate": 96.67,
  "unique_users": 25,
  "unique_usernames_attempted": 27,
  "average_session_duration_seconds": 3600
}
   │
   ▼
Display Report / Alerts
```

## Data Relationships

```
User Table (original)
│
├─ id
├─ username
├─ email
├─ role
├─ is_active
└─ [created_at, updated_at]
   │
   │ (1:Many)
   │
   ▼
LoginAudit Table (new)
│
├─ id
├─ user_id ─────────┐ (FK → User.id)
├─ username         │ (copied for orphaned logins)
├─ email            │ (copied for history)
├─ login_status     │ SUCCESS or FAILED
├─ failure_reason   │ (NULL if SUCCESS)
├─ ip_address       │ (security monitoring)
├─ user_agent       │ (device identification)
├─ session_id       │ (session tracking)
├─ login_timestamp  │ (when login occurred)
├─ logout_timestamp │ (when logout occurred)
└─ duration_seconds │ (calculated on logout)

One User can have Many Login Audit Records
```

## API Response Flow

```
Client Request
   │
   ▼
Route Handler (@app.get/post)
   │
   ├─ Extract parameters
   │  ├─ user_id
   │  ├─ limit
   │  └─ days/threshold
   │
   ├─ Call LoginAuditManager method
   │  ├─ get_recent_logins()
   │  ├─ get_user_login_history()
   │  ├─ get_failed_login_attempts()
   │  ├─ get_login_stats()
   │  ├─ get_suspicious_activity()
   │  └─ log_logout()
   │
   ├─ Manager queries database
   │  ├─ Session.query(LoginAudit)
   │  ├─ Apply filters
   │  ├─ Order by timestamp
   │  └─ Limit results
   │
   ├─ Format results as list of dicts
   │
   ├─ Return JSON response
   │  ├─ status: "success"
   │  ├─ count: number
   │  └─ data: [records]
   │
   ▼
Client receives JSON
   │
   ▼
Display/Process data
```

## Session Lifecycle

```
Session Created         Session Active         Session Ended
      │                       │                     │
      ▼                       ▼                     ▼
┌─────────────┐        ┌─────────────┐      ┌─────────────┐
│   LOGIN     │        │   USE APP   │      │   LOGOUT    │
├─────────────┤        ├─────────────┤      ├─────────────┤
│ session_id: │        │ sessionId   │      │ sessionId   │
│ UUID-XXXX   │        │ stored in   │      │ sent to     │
├─────────────┤        │ localStorage│      │ backend     │
│ user_id: 5  │        ├─────────────┤      ├─────────────┤
├─────────────┤        │ User can    │      │ Duration    │
│ status:     │        │ make API    │      │ calculated  │
│ SUCCESS     │        │ calls       │      │ & stored    │
├─────────────┤        ├─────────────┤      ├─────────────┤
│ login_time: │        │ IP & UA     │      │ logout_time:│
│ 2026-01-04  │        │ tracked     │      │ 2026-01-04  │
│ 14:32:55    │        └─────────────┘      │ 14:45:30    │
│             │                             ├─────────────┤
│ Database    │                             │ duration:   │
│ Record:     │                             │ 815 seconds │
│ login_audit │                             │ (13m 35s)   │
│ id: 123     │                             └─────────────┘
└─────────────┘
```

## Security Monitoring Workflow

```
┌─────────────────────────────────────────────────┐
│  Continuous Login Attempts                      │
└──────────────┬──────────────────────────────────┘
               │
               ├─ ✓ Successful ─────────┐
               │                        │
               │ ✗ Failed ──────────┐   │
               │                    │   │
               ▼                    │   │
        ┌──────────────┐            │   │
        │ Log Entry    │            │   │
        │ Created      │            │   │
        └──────┬───────┘            │   │
               │                    │   │
               │ Every 5 minutes    │   │
               ▼                    │   │
        ┌──────────────────┐        │   │
        │ Check Suspicious │        │   │
        │ Activity Monitor │        │   │
        └────────┬─────────┘        │   │
                 │                  │   │
          ┌──────┴───────────┐      │   │
          │                  │      │   │
      ✗ (3+ failed)      ✓ (OK)    │   │
          │                  │      │   │
          ▼                  ▼      │   │
      ┌─────────┐        ┌──────┐  │   │
      │ ALERT!  │        │ Log  │  │   │
      │ Block   │        │ &    │  │   │
      │ IP      │        │ Track│  │   │
      └─────────┘        └──────┘  │   │
                              │    │   │
                              └────┴───┘
                                    │
                                    ▼
                            (All recorded in
                             login_audit table)
```

## Complete Audit Trail Example

```
Timeline of Events
──────────────────

14:32:55 - User: admin, IP: 192.168.1.100
          Event: LOGIN (SUCCESS)
          Record: {id: 1, session_id: UUID-A, ...}

14:35:22 - User: attacker, IP: 203.0.113.50
          Event: LOGIN ATTEMPT (FAILED)
          Reason: Invalid credentials
          Record: {id: 2, ...}

14:35:27 - User: attacker, IP: 203.0.113.50
          Event: LOGIN ATTEMPT (FAILED)
          Reason: Invalid credentials
          Record: {id: 3, ...}

14:35:31 - User: attacker, IP: 203.0.113.50
          Event: LOGIN ATTEMPT (FAILED)
          Reason: Invalid credentials
          Record: {id: 4, ...}
          → SUSPICIOUS ACTIVITY DETECTED ⚠️

14:38:10 - User: john_doe, IP: 192.168.2.200
          Event: LOGIN (SUCCESS)
          Record: {id: 5, session_id: UUID-B, ...}

14:45:30 - User: admin, IP: 192.168.1.100
          Event: LOGOUT
          Session Duration: 13m 35s
          Update: {id: 1, duration_seconds: 815, ...}

Reports Available:
─────────────────
- Recent logins: Shows last 50 attempts
- Failed attempts: Shows 3 failures from attacker
- Suspicious activity: Shows brute force attempt
- Statistics: 2 success, 3 failures, 40% success rate
- User history: Shows both successful logins
```

---

These diagrams show how the login audit system architecture works, how data flows through the system, and how security monitoring is performed in real-time.
