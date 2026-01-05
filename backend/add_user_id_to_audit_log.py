#!/usr/bin/env python
"""
Migration script to add user_id foreign key column to audit_log table
"""

from sqlalchemy import text
from database import engine

def add_user_id_column():
    """Add user_id column to audit_log table"""
    with engine.connect() as connection:
        try:
            # Check if column already exists
            check_query = text("""
                SELECT column_name FROM information_schema.columns 
                WHERE table_name='audit_log' AND column_name='user_id'
            """)
            result = connection.execute(check_query)
            if result.fetchone():
                print("✓ user_id column already exists in audit_log table")
                return
            
            # Add the column
            add_column_query = text("""
                ALTER TABLE audit_log 
                ADD COLUMN user_id INTEGER REFERENCES "user"(id) ON DELETE SET NULL
            """)
            connection.execute(add_column_query)
            connection.commit()
            print("✓ Successfully added user_id column to audit_log table")
            
            # Create index on user_id
            index_query = text("""
                CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id)
            """)
            connection.execute(index_query)
            connection.commit()
            print("✓ Successfully created index on user_id column")
            
        except Exception as e:
            print(f"✗ Error adding user_id column: {str(e)}")
            import traceback
            traceback.print_exc()

if __name__ == '__main__':
    print("Starting migration: Add user_id to audit_log table...")
    add_user_id_column()
    print("Migration complete!")
