#!/usr/bin/env python
"""
Audit Context Manager
Provides a context manager to set employee_id for audit logging
"""

from database import Session
from sqlalchemy import text
from contextlib import contextmanager


@contextmanager
def audit_context(session, employee_id: str):
    """
    Context manager to set employee_id for audit logging
    
    Usage:
        from backend.audit_context import audit_context
        from database import Session
        
        session = Session()
        with audit_context(session, employee_id="EMP001"):
            # Any database changes here will be logged with employee_id
            user.name = "Updated Name"
            session.commit()
    
    Args:
        session: SQLAlchemy session
        employee_id: Employee ID to associate with changes
    """
    try:
        # Set the session variable
        session.execute(text(f"SET app.current_employee_id = '{employee_id}'"))
        session.commit()
        yield
    finally:
        # Reset the session variable
        try:
            session.execute(text("RESET app.current_employee_id"))
            session.commit()
        except:
            pass
        session.close()


def set_audit_employee(session, employee_id: str):
    """
    Directly set the employee_id for audit logging (without context manager)
    
    Usage:
        from backend.audit_context import set_audit_employee
        from database import Session
        
        session = Session()
        set_audit_employee(session, employee_id="EMP001")
        # Now make changes - they will be logged
        user.name = "Updated Name"
        session.commit()
    
    Args:
        session: SQLAlchemy session
        employee_id: Employee ID to associate with changes
    """
    try:
        session.execute(text(f"SET app.current_employee_id = '{employee_id}'"))
        session.commit()
    except Exception as e:
        print(f"[AUDIT] Error setting employee_id: {str(e)}")


def reset_audit_employee(session):
    """
    Reset the employee_id session variable
    
    Args:
        session: SQLAlchemy session
    """
    try:
        session.execute(text("RESET app.current_employee_id"))
        session.commit()
    except:
        pass
