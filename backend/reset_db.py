"""
Database reset script - drops and recreates all tables
Usage: python reset_db.py
"""
from sqlalchemy import text
from database import engine
from dbmodel import Product, User
from database import Base

print("[INFO] Resetting database...")

# Drop all tables with CASCADE
conn = engine.connect()
try:
    conn.execute(text('DROP TABLE IF EXISTS "user" CASCADE'))
    conn.execute(text('DROP TABLE IF EXISTS product_1 CASCADE'))
    conn.commit()
    print("[SUCCESS] Dropped all tables")
except Exception as e:
    print(f"[ERROR] Failed to drop tables: {e}")
    conn.rollback()
finally:
    conn.close()

# Recreate all tables based on models
try:
    Base.metadata.create_all(engine)
    print("[SUCCESS] Tables recreated successfully")
except Exception as e:
    print(f"[ERROR] Failed to create tables: {e}")

