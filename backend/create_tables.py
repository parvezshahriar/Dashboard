#!/usr/bin/env python
"""
Script to create all database tables (migrations)
Run this script once to create the user_info table
"""

from database import engine, Base
from dbmodel import Product, User, UserInfo, Image, BatchUpload

def create_tables():
    """Create all tables in the database"""
    print("[CREATE_TABLES] Starting table creation...")
    
    try:
        Base.metadata.create_all(bind=engine)
        print("[CREATE_TABLES] Step 1: All tables created successfully!")
        print("[CREATE_TABLES] Step 2: Tables created:")
        print("  - product_1 (Products)")
        print("  - user (Users)")
        print("  - user_info (User Profile Information)")
        print("  - image (Profile Images)")
        print("  - batch_upload (Batch Uploads)")
        print("[CREATE_TABLES] Step 3: Database migration completed!")
        return True
    except Exception as e:
        print(f"[CREATE_TABLES] ERROR: Failed to create tables: {str(e)}")
        return False

if __name__ == "__main__":
    success = create_tables()
    exit(0 if success else 1)
