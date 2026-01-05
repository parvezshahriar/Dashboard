# Audit Log Trigger System Documentation

## Overview

The audit log trigger system automatically tracks all INSERT, UPDATE, and DELETE operations on critical database tables. This provides complete traceability of data changes for compliance, debugging, and security purposes.

## Architecture

### 1. **Audit Log Table** (`audit_log`)

Stores all audit records with the following fields:

| Column | Type | Purpose |
|--------|------|---------|
| `id` | Integer | Primary key |
| `table_name` | String | Name of the modified table |
| `operation` | String | Type of operation (INSERT, UPDATE, DELETE) |
| `record_id` | String | Primary key of the affected record |
| `old_values` | JSON | Previous values before change (NULL for INSERT) |
| `new_values` | JSON | New values after change (NULL for DELETE) |
| `changed_columns` | JSON | Array of column names that changed |
| `user_id` | Integer | User who made the change (optional) |
| `timestamp` | DateTime | When the change occurred |
| `description` | Text | Additional context/notes |

### 2. **Trigger Function** (`audit_trigger_function`)

PostgreSQL PL/pgSQL function that:
- Captures the operation type (INSERT, UPDATE, DELETE)
- Converts row data to JSON format using `row_to_json()`
- Identifies changed columns by comparing old vs new values
- Inserts audit log entry automatically

### 3. **Table Triggers**

Individual triggers on each monitored table:

```sql
CREATE TRIGGER user_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON "user"
FOR EACH ROW
EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER product_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON product_1
FOR EACH ROW
EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER batch_upload_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON batch_upload
FOR EACH ROW
EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER user_info_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON user_info
FOR EACH ROW
EXECUTE FUNCTION audit_trigger_function();
```

## Implementation Files

### Core Files

1. **[audit_log.py](audit_log.py)**
   - Defines `AuditLog` SQLAlchemy model
   - Contains `audit_trigger_function()` - PostgreSQL trigger implementation
   - Contains `create_audit_triggers()` - Creates triggers for all tables
   - Contains `setup_audit_system()` - Complete setup orchestration

2. **[audit_log_manager.py](audit_log_manager.py)**
   - `AuditLogManager` class for querying audit logs
   - Methods for retrieving change history
   - Methods for analyzing audit data
   - Pretty printing utilities

3. **[setup_audit_log.py](setup_audit_log.py)**
   - Standalone script to initialize audit system
   - User-friendly output and status messages

## How the Trigger Works

### INSERT Operation

```
NEW DATA: {id: 1, username: "john", email: "john@example.com", ...}

Trigger captures:
├── operation: "INSERT"
├── record_id: "1"
├── new_values: {full JSON object}
├── old_values: NULL
└── changed_columns: NULL
```

### UPDATE Operation

```
OLD DATA: {id: 1, username: "john", email: "john@example.com"}
NEW DATA: {id: 1, username: "john_new", email: "john@example.com"}

Trigger captures:
├── operation: "UPDATE"
├── record_id: "1"
├── old_values: {full JSON object}
├── new_values: {full JSON object}
└── changed_columns: ["username"]
```

### DELETE Operation

```
DELETED DATA: {id: 1, username: "john", email: "john@example.com"}

Trigger captures:
├── operation: "DELETE"
├── record_id: "1"
├── old_values: {full JSON object}
├── new_values: NULL
└── changed_columns: NULL
```

## Setup Instructions

### Step 1: Update Database Models

The `AuditLog` model has already been added to `dbmodel.py`:

```python
from sqlalchemy import Column, Integer, String, Float, DateTime, func, Text
from sqlalchemy.dialects.postgresql import JSON

class AuditLog(Base):
    __tablename__ = 'audit_log'
    id = Column(Integer, primary_key=True, index=True)
    table_name = Column(String, index=True)
    operation = Column(String, index=True)
    record_id = Column(String, index=True)
    old_values = Column(JSON, nullable=True)
    new_values = Column(JSON, nullable=True)
    changed_columns = Column(JSON, nullable=True)
    user_id = Column(Integer, nullable=True, index=True)
    timestamp = Column(DateTime, default=func.now(), index=True)
    description = Column(Text, nullable=True)
```

### Step 2: Create Tables

```bash
# Create all tables including audit_log
python backend/create_tables.py
```

### Step 3: Initialize Audit System

```bash
# Create triggers and functions
python backend/setup_audit_log.py
```

Expected output:
```
============================================================
AUDIT LOG SYSTEM INITIALIZATION
============================================================

[AUDIT_LOG] Starting audit log system setup...
[AUDIT_LOG] ✓ Audit log table created
[AUDIT_LOG] ✓ Audit trigger function created successfully
[AUDIT_LOG] ✓ All audit triggers created successfully
[AUDIT_LOG] ✓ Audit system fully initialized

============================================================
SUCCESS: Audit log system is ready!
============================================================

The following tables now have audit logging:
  1. user - Track user account changes
  2. product_1 - Track product/payment data changes
  3. batch_upload - Track batch operation changes
  4. user_info - Track user profile changes

All INSERT, UPDATE, and DELETE operations are logged automatically.
Query audit_log table for change history.
```

## Usage Examples

### 1. View Recent Changes

```python
from backend.audit_log_manager import AuditLogManager

# Get last 10 changes across all tables
logs = AuditLogManager.get_recent_changes(limit=10)
for log in logs:
    print(f"{log['timestamp']} - {log['operation']} on {log['table']}")

# Get changes to specific table
product_logs = AuditLogManager.get_recent_changes('product_1', limit=20)
```

### 2. Get Record History

```python
# See all changes to a specific user
history = AuditLogManager.get_changes_for_record('user', '5')
for change in history:
    print(f"{change['timestamp']}: {change['operation']}")

# Pretty print with formatting
AuditLogManager.print_record_history('user', '5')
```

### 3. Find Changes by User

```python
# See what user #3 modified
changes = AuditLogManager.get_changes_by_user(user_id=3, limit=50)
for change in changes:
    print(f"{change['timestamp']} - Modified {change['table']}")
```

### 4. Time-Based Queries

```python
from datetime import datetime, timedelta

# Get changes from last 7 days
start = datetime.now() - timedelta(days=7)
end = datetime.now()
changes = AuditLogManager.get_changes_in_period(start, end)

# Get changes to batch_upload in last 24 hours
start = datetime.now() - timedelta(days=1)
changes = AuditLogManager.get_changes_in_period(start, end, 'batch_upload')
```

### 5. Get Summary Statistics

```python
# Operations summary for last 7 days
summary = AuditLogManager.get_operation_summary(days=7)
print(summary)
# Output: {'user': {'INSERT': 5, 'UPDATE': 12, 'DELETE': 0}, ...}
```

## SQL Query Examples

### Direct PostgreSQL Queries

```sql
-- See all changes to a user record
SELECT * FROM audit_log 
WHERE table_name = 'user' AND record_id = '5'
ORDER BY timestamp DESC;

-- See all deletions in the last 24 hours
SELECT * FROM audit_log 
WHERE operation = 'DELETE' 
AND timestamp > NOW() - INTERVAL '24 hours'
ORDER BY timestamp DESC;

-- Count changes by operation type
SELECT operation, COUNT(*) as count 
FROM audit_log 
GROUP BY operation;

-- See what changed in a specific update
SELECT changed_columns, old_values, new_values 
FROM audit_log 
WHERE id = 42;

-- Find all changes made to a record
SELECT * FROM audit_log 
WHERE table_name = 'batch_upload' AND record_id = '100'
ORDER BY timestamp;
```

## Integration with API

### Add Audit User Tracking

To track which user made changes, update the application code:

```python
from database import Session
from dbmodel import AuditLog

# In your API endpoint, after data modification:
audit_entry = AuditLog(
    table_name='user',
    operation='UPDATE',
    record_id=str(user.id),
    user_id=current_user.id,  # Add current user ID
    description=f"User {current_user.username} updated profile"
)
session.add(audit_entry)
session.commit()
```

### Create Audit Middleware

```python
from fastapi import Request
from datetime import datetime

async def audit_middleware(request: Request, call_next):
    # Log API request metadata
    response = await call_next(request)
    
    # Optional: Track API audit separately
    return response
```

## Performance Considerations

### Indexes

The `audit_log` table has indexes on:
- `table_name` - Fast filtering by table
- `operation` - Fast filtering by operation type
- `record_id` - Fast lookup of specific records
- `user_id` - Fast filtering by user
- `timestamp` - Fast time-range queries

### Archival Strategy

For production systems handling high volumes:

```sql
-- Archive old audit logs (monthly)
INSERT INTO audit_log_archive
SELECT * FROM audit_log 
WHERE timestamp < NOW() - INTERVAL '1 year';

DELETE FROM audit_log 
WHERE timestamp < NOW() - INTERVAL '1 year';
```

## Trigger Maintenance

### View All Triggers

```sql
SELECT trigger_name, table_name, event_object_schema
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY table_name;
```

### Disable/Enable Trigger

```sql
-- Temporarily disable trigger (for bulk operations)
ALTER TABLE "user" DISABLE TRIGGER user_audit_trigger;

-- Re-enable trigger
ALTER TABLE "user" ENABLE TRIGGER user_audit_trigger;
```

### Drop Trigger

```sql
DROP TRIGGER IF EXISTS user_audit_trigger ON "user";
```

## Troubleshooting

### Issue: Trigger Not Firing

**Check:**
```sql
SELECT * FROM information_schema.triggers 
WHERE trigger_name LIKE '%audit%';
```

**Solution:** Re-run `setup_audit_log.py`

### Issue: Audit Log Table Not Created

**Check:**
```sql
SELECT * FROM information_schema.tables 
WHERE table_name = 'audit_log';
```

**Solution:** Run `create_tables.py` followed by `setup_audit_log.py`

### Issue: JSON Column Not Supported

**Check:** PostgreSQL version (must be 9.2+)

**Solution:** Update PostgreSQL or use TEXT instead of JSON

## Best Practices

1. **Regular Reviews**: Schedule weekly reviews of critical table changes
2. **Retention Policy**: Archive logs older than 1 year
3. **Access Control**: Restrict who can query audit logs
4. **Documentation**: Document why changes were made in the `description` field
5. **Alerts**: Set up alerts for suspicious activity patterns
6. **Testing**: Test trigger behavior before production deployment

## Files Reference

| File | Purpose |
|------|---------|
| `audit_log.py` | Core trigger implementation |
| `audit_log_manager.py` | Query and analysis utilities |
| `setup_audit_log.py` | Setup and initialization |
| `dbmodel.py` | Contains AuditLog model definition |

---

**Created:** January 4, 2026
**Version:** 1.0
**Database:** PostgreSQL 12+
