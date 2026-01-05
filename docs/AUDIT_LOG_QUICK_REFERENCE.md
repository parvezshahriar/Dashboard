# Audit Log - Quick Reference

## Setup (One-Time)

```bash
# 1. Create database tables
python backend/create_tables.py

# 2. Initialize audit system with triggers
python backend/setup_audit_log.py
```

## What Gets Logged

✅ **user** table - User account changes (create/update/delete)
✅ **product_1** table - Payment data changes
✅ **batch_upload** table - Batch operation changes
✅ **user_info** table - User profile changes

## Query Audit Logs

### Python Code

```python
from backend.audit_log_manager import AuditLogManager

# Recent changes
AuditLogManager.print_recent_changes('user', limit=10)

# Specific record history
AuditLogManager.print_record_history('user', '5')

# By user
changes = AuditLogManager.get_changes_by_user(user_id=3)

# Date range
from datetime import datetime, timedelta
start = datetime.now() - timedelta(days=7)
end = datetime.now()
changes = AuditLogManager.get_changes_in_period(start, end)

# Summary
summary = AuditLogManager.get_operation_summary(days=7)
```

### Direct SQL Queries

```sql
-- All changes to a record
SELECT * FROM audit_log 
WHERE table_name = 'user' AND record_id = '5'
ORDER BY timestamp DESC;

-- All deletions
SELECT * FROM audit_log 
WHERE operation = 'DELETE'
ORDER BY timestamp DESC;

-- Changes in last 24 hours
SELECT * FROM audit_log 
WHERE timestamp > NOW() - INTERVAL '24 hours'
ORDER BY timestamp DESC;

-- Count by operation
SELECT operation, COUNT(*) FROM audit_log GROUP BY operation;
```

## Audit Log Columns

| Field | Contains | Example |
|-------|----------|---------|
| `table_name` | Which table changed | "user", "product_1" |
| `operation` | Type of change | "INSERT", "UPDATE", "DELETE" |
| `record_id` | Which record | "5" |
| `timestamp` | When it happened | "2026-01-04 15:30:45" |
| `changed_columns` | What changed | ["username", "email"] |
| `old_values` | Previous values | JSON of old data |
| `new_values` | New values | JSON of new data |
| `user_id` | Who did it | 3 |

## How It Works

1. **You change data** → User updates their profile
2. **Trigger fires** → Database automatically captures the change
3. **Audit logged** → Entry saved to `audit_log` table
4. **Query it anytime** → View history of what changed, when, and by whom

## Examples

### Example 1: User Registration Audit

```sql
SELECT operation, timestamp, new_values 
FROM audit_log 
WHERE table_name = 'user' 
AND operation = 'INSERT'
ORDER BY timestamp DESC;
```

Result:
```
INSERT | 2026-01-04 10:30:00 | {"id": 42, "username": "john", "email": "john@ex.com"}
INSERT | 2026-01-04 10:29:00 | {"id": 41, "username": "jane", "email": "jane@ex.com"}
```

### Example 2: What Changed in an Update

```sql
SELECT changed_columns, old_values, new_values 
FROM audit_log 
WHERE table_name = 'user' 
AND record_id = '5' 
AND operation = 'UPDATE'
LIMIT 1;
```

Result:
```
changed_columns: ["email"]
old_values:     {"email": "old@example.com"}
new_values:     {"email": "new@example.com"}
```

### Example 3: Deleted Record Recovery

```sql
SELECT old_values 
FROM audit_log 
WHERE table_name = 'product_1' 
AND record_id = 'REF12345' 
AND operation = 'DELETE';
```

Result:
```
{
  "EFTREFNUMBER": "REF12345",
  "BENEFICIARY_ID": "BEN001",
  "CRAMOUNT": 5000.00,
  "MOBILE": "8801234567"
  ...
}
```

## Trigger Details

### PostgreSQL Trigger Function

```
Function: audit_trigger_function()
Language: PL/pgSQL

For INSERT:
├─ Captures: new_values (JSON)
├─ Captures: timestamp
└─ Logs: INSERT operation

For UPDATE:
├─ Captures: old_values (JSON)
├─ Captures: new_values (JSON)
├─ Compares: columns to find changes
└─ Logs: changed_columns array

For DELETE:
├─ Captures: old_values (JSON)
└─ Logs: DELETE operation
```

### Triggers Installed

```
user_audit_trigger          → ON "user" table
product_audit_trigger       → ON product_1 table
batch_upload_audit_trigger  → ON batch_upload table
user_info_audit_trigger     → ON user_info table
```

## Maintenance

### Check If Triggers Are Active

```sql
SELECT trigger_name, is_enabled 
FROM information_schema.triggers 
WHERE trigger_name LIKE '%audit%';
```

### Temporarily Disable Trigger

```sql
-- Before bulk operations
ALTER TABLE "user" DISABLE TRIGGER user_audit_trigger;

-- After bulk operations
ALTER TABLE "user" ENABLE TRIGGER user_audit_trigger;
```

### View Trigger SQL

```sql
SELECT pg_get_triggerdef(oid) 
FROM pg_trigger 
WHERE tgname = 'user_audit_trigger';
```

## Performance

- **Indexes**: table_name, operation, record_id, user_id, timestamp
- **Storage**: ~1KB per audit entry (varies by JSON size)
- **Speed**: Minimal overhead (<1ms per operation)
- **Retention**: Keep logs for 1+ years, archive older data

## Common Tasks

### Find who deleted records
```sql
SELECT record_id, timestamp, user_id FROM audit_log 
WHERE operation = 'DELETE' 
AND timestamp > NOW() - INTERVAL '7 days';
```

### Find most modified record
```sql
SELECT record_id, COUNT(*) as changes 
FROM audit_log 
WHERE table_name = 'user'
GROUP BY record_id 
ORDER BY changes DESC;
```

### Audit trail for compliance
```sql
SELECT table_name, operation, COUNT(*) 
FROM audit_log 
WHERE timestamp > NOW() - INTERVAL '30 days'
GROUP BY table_name, operation;
```

---

**Quick Setup Command:**
```bash
python backend/create_tables.py && python backend/setup_audit_log.py
```

**View Recent Activity:**
```python
from backend.audit_log_manager import AuditLogManager
AuditLogManager.print_recent_changes(limit=20)
```
