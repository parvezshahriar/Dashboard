#!/usr/bin/env python
"""Check and fix audit_log table structure"""

from database import Session, engine
from sqlalchemy import text, MetaData, Table

# Check current columns
with engine.connect() as conn:
    result = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='audit_log'"))
    columns = [row[0] for row in result]
    print("Current audit_log columns:", columns)
    
    # Check if employee_id column exists
    if 'employee_id' not in columns:
        print("\nAdding employee_id column...")
        try:
            conn.execute(text("ALTER TABLE audit_log ADD COLUMN employee_id VARCHAR"))
            conn.commit()
            print("✓ employee_id column added successfully")
        except Exception as e:
            print(f"Error adding column: {e}")
            conn.rollback()
    else:
        print("✓ employee_id column already exists")

print("\nFinal audit_log columns:")
with engine.connect() as conn:
    result = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='audit_log'"))
    columns = [row[0] for row in result]
    for col in sorted(columns):
        print(f"  - {col}")
