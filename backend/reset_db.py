from sqlalchemy import text
from database import engine
from dbmodel import Product, User, ImageModel, Country
from database import Base

# Drop all tables with CASCADE
conn = engine.connect()
try:
    conn.execute(text('DROP TABLE IF EXISTS orderdetails CASCADE'))
    conn.execute(text('DROP TABLE IF EXISTS product CASCADE'))
    conn.execute(text('DROP TABLE IF EXISTS product_1 CASCADE'))
    conn.execute(text('DROP TABLE IF EXISTS "user" CASCADE'))
    conn.execute(text('DROP TABLE IF EXISTS images CASCADE'))
    conn.execute(text('DROP TABLE IF EXISTS country CASCADE'))
    # Drop orphaned indexes
    conn.execute(text('DROP INDEX IF EXISTS ix_product_id CASCADE'))
    conn.execute(text('DROP INDEX IF EXISTS ix_product_1_id CASCADE'))
    conn.execute(text('DROP INDEX IF EXISTS ix_user_id CASCADE'))
    conn.execute(text('DROP INDEX IF EXISTS ix_user_username CASCADE'))
    conn.execute(text('DROP INDEX IF EXISTS ix_images_id CASCADE'))
    conn.execute(text('DROP INDEX IF EXISTS ix_images_filename CASCADE'))
    conn.execute(text('DROP INDEX IF EXISTS ix_country_id CASCADE'))
    conn.execute(text('DROP INDEX IF EXISTS ix_country_name CASCADE'))
    conn.commit()
    print("Dropped all tables and indexes successfully")
except Exception as e:
    print(f"Error dropping tables: {e}")
    conn.rollback()
finally:
    conn.close()

# Recreate all tables based on models
try:
    Base.metadata.create_all(engine)
    print("Tables recreated successfully")
except Exception as e:
    print(f"Error creating tables: {e}")
