from database import engine
from sqlalchemy import text

with engine.connect() as conn:
    conn.execute(text('DROP TRIGGER IF EXISTS user_audit_trigger ON "user" CASCADE'))
    conn.execute(text('DROP TRIGGER IF EXISTS product_audit_trigger ON product_1 CASCADE'))
    conn.execute(text('DROP TRIGGER IF EXISTS batch_upload_audit_trigger ON batch_upload CASCADE'))
    conn.execute(text('DROP TRIGGER IF EXISTS user_info_audit_trigger ON user_info CASCADE'))
    conn.execute(text('DROP FUNCTION IF EXISTS audit_trigger_function() CASCADE'))
    conn.execute(text('DROP TABLE IF EXISTS audit_log CASCADE'))
    conn.commit()
    print('[CLEANUP] Cleaned up old audit_log')
