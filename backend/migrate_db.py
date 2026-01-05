#!/usr/bin/env python
"""
Script to alter the product_1 table and add missing columns
"""

from database import engine
from sqlalchemy import text

def migrate_tables():
    """Add missing columns to existing tables"""
    print("[MIGRATE] Starting database migration...")
    
    with engine.connect() as conn:
        try:
            # Add batch_id column if it doesn't exist
            print("[MIGRATE] Checking for batch_id column...")
            conn.execute(text("""
                ALTER TABLE product_1 
                ADD COLUMN IF NOT EXISTS batch_id INTEGER
            """))
            conn.commit()
            print("[MIGRATE] ✓ batch_id column added/verified")
            
            # Add index if it doesn't exist
            print("[MIGRATE] Adding index to batch_id...")
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS ix_product_1_batch_id 
                ON product_1 (batch_id)
            """))
            conn.commit()
            print("[MIGRATE] ✓ Index created/verified")
            
            print("[MIGRATE] ✓ Migration completed successfully!")
            return True
            
        except Exception as e:
            print(f"[MIGRATE] ERROR: {str(e)}")
            conn.rollback()
            return False

if __name__ == "__main__":
    success = migrate_tables()
    exit(0 if success else 1)
