#!/usr/bin/env python
"""
Login Audit Manager
Manages all login audit log operations including tracking successful and failed login attempts
"""

from database import Session
from dbmodel import LoginAudit
from sqlalchemy import desc, and_
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import uuid


class LoginAuditManager:
    """Manager class for login audit operations"""
    
    @staticmethod
    def log_login_attempt(
        username: str,
        user_id: Optional[int] = None,
        email: Optional[str] = None,
        login_status: str = 'SUCCESS',
        failure_reason: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> Dict:
        """
        Log a login attempt (successful or failed)
        
        Args:
            username: Username that was used for login
            user_id: User ID (None for failed logins)
            email: User's email address
            login_status: 'SUCCESS' or 'FAILED'
            failure_reason: Reason for failure (if applicable)
            ip_address: Client IP address
            user_agent: Browser/client user agent string
            
        Returns:
            Dictionary with login audit record details including session_id
        """
        session = Session()
        try:
            session_id = str(uuid.uuid4())
            
            login_audit = LoginAudit(
                user_id=user_id,
                username=username,
                email=email,
                login_status=login_status,
                failure_reason=failure_reason,
                ip_address=ip_address,
                user_agent=user_agent,
                session_id=session_id,
                login_timestamp=datetime.now()
            )
            
            session.add(login_audit)
            session.commit()
            session.refresh(login_audit)
            
            return {
                'audit_id': login_audit.id,
                'session_id': session_id,
                'username': username,
                'user_id': user_id,
                'login_status': login_status,
                'login_timestamp': login_audit.login_timestamp.isoformat()
            }
        except Exception as e:
            session.rollback()
            raise Exception(f"Failed to log login attempt: {str(e)}")
        finally:
            session.close()
    
    @staticmethod
    def log_logout(session_id: str, logout_timestamp: Optional[datetime] = None) -> bool:
        """
        Log a logout event and calculate session duration
        
        Args:
            session_id: Session ID from login attempt
            logout_timestamp: When logout occurred (default: now)
            
        Returns:
            True if logout was logged successfully
        """
        session = Session()
        try:
            logout_time = logout_timestamp or datetime.now()
            
            login_audit = session.query(LoginAudit).filter(
                LoginAudit.session_id == session_id
            ).first()
            
            if login_audit:
                login_audit.logout_timestamp = logout_time
                if login_audit.login_timestamp:
                    duration = (logout_time - login_audit.login_timestamp).total_seconds()
                    login_audit.duration_seconds = int(duration)
                
                session.commit()
                return True
            
            return False
        except Exception as e:
            session.rollback()
            raise Exception(f"Failed to log logout: {str(e)}")
        finally:
            session.close()
    
    @staticmethod
    def get_recent_logins(limit: int = 50) -> List[Dict]:
        """
        Get recent login attempts (successful and failed)
        
        Args:
            limit: Number of records to return
            
        Returns:
            List of login audit entries
        """
        session = Session()
        try:
            logins = session.query(LoginAudit).order_by(
                desc(LoginAudit.login_timestamp)
            ).limit(limit).all()
            
            return [{
                'id': login.id,
                'username': login.username,
                'user_id': login.user_id,
                'email': login.email,
                'login_status': login.login_status,
                'failure_reason': login.failure_reason,
                'ip_address': login.ip_address,
                'login_timestamp': login.login_timestamp.isoformat() if login.login_timestamp else None,
                'logout_timestamp': login.logout_timestamp.isoformat() if login.logout_timestamp else None,
                'duration_seconds': login.duration_seconds,
                'session_id': login.session_id
            } for login in logins]
        finally:
            session.close()
    
    @staticmethod
    def get_user_login_history(user_id: int, limit: int = 50) -> List[Dict]:
        """
        Get login history for a specific user
        
        Args:
            user_id: User ID to get history for
            limit: Number of records to return
            
        Returns:
            List of login audit entries for the user
        """
        session = Session()
        try:
            logins = session.query(LoginAudit).filter(
                LoginAudit.user_id == user_id
            ).order_by(desc(LoginAudit.login_timestamp)).limit(limit).all()
            
            return [{
                'id': login.id,
                'username': login.username,
                'login_status': login.login_status,
                'ip_address': login.ip_address,
                'user_agent': login.user_agent,
                'login_timestamp': login.login_timestamp.isoformat() if login.login_timestamp else None,
                'logout_timestamp': login.logout_timestamp.isoformat() if login.logout_timestamp else None,
                'duration_seconds': login.duration_seconds,
                'session_id': login.session_id
            } for login in logins]
        finally:
            session.close()
    
    @staticmethod
    def get_failed_login_attempts(limit: int = 50) -> List[Dict]:
        """
        Get failed login attempts
        
        Args:
            limit: Number of records to return
            
        Returns:
            List of failed login audit entries
        """
        session = Session()
        try:
            failed_logins = session.query(LoginAudit).filter(
                LoginAudit.login_status == 'FAILED'
            ).order_by(desc(LoginAudit.login_timestamp)).limit(limit).all()
            
            return [{
                'id': login.id,
                'username': login.username,
                'failure_reason': login.failure_reason,
                'ip_address': login.ip_address,
                'login_timestamp': login.login_timestamp.isoformat() if login.login_timestamp else None
            } for login in failed_logins]
        finally:
            session.close()
    
    @staticmethod
    def get_login_stats(days: int = 7) -> Dict:
        """
        Get login statistics for a period
        
        Args:
            days: Number of days to analyze
            
        Returns:
            Dictionary with login statistics
        """
        session = Session()
        try:
            cutoff_date = datetime.now() - timedelta(days=days)
            
            all_logins = session.query(LoginAudit).filter(
                LoginAudit.login_timestamp >= cutoff_date
            ).all()
            
            successful = [l for l in all_logins if l.login_status == 'SUCCESS']
            failed = [l for l in all_logins if l.login_status == 'FAILED']
            
            unique_users = len(set(l.user_id for l in successful if l.user_id))
            unique_usernames = len(set(l.username for l in all_logins))
            
            avg_session_duration = None
            if successful:
                durations = [l.duration_seconds for l in successful if l.duration_seconds]
                if durations:
                    avg_session_duration = sum(durations) / len(durations)
            
            return {
                'period_days': days,
                'total_login_attempts': len(all_logins),
                'successful_logins': len(successful),
                'failed_login_attempts': len(failed),
                'success_rate': (len(successful) / len(all_logins) * 100) if all_logins else 0,
                'unique_users': unique_users,
                'unique_usernames_attempted': unique_usernames,
                'average_session_duration_seconds': round(avg_session_duration, 2) if avg_session_duration else None
            }
        finally:
            session.close()
    
    @staticmethod
    def get_suspicious_activity(threshold_minutes: int = 5) -> List[Dict]:
        """
        Get suspicious activity (multiple failed logins from same IP in short time)
        
        Args:
            threshold_minutes: Time window to check for repeated failures
            
        Returns:
            List of suspicious activities
        """
        session = Session()
        try:
            cutoff_time = datetime.now() - timedelta(minutes=threshold_minutes)
            
            failed_logins = session.query(LoginAudit).filter(
                and_(
                    LoginAudit.login_status == 'FAILED',
                    LoginAudit.login_timestamp >= cutoff_time
                )
            ).order_by(desc(LoginAudit.login_timestamp)).all()
            
            # Group by IP address
            ip_attempts = {}
            for login in failed_logins:
                if login.ip_address:
                    if login.ip_address not in ip_attempts:
                        ip_attempts[login.ip_address] = []
                    ip_attempts[login.ip_address].append(login)
            
            suspicious = []
            for ip, attempts in ip_attempts.items():
                if len(attempts) >= 3:  # 3+ failed attempts in threshold time
                    suspicious.append({
                        'ip_address': ip,
                        'failed_attempts': len(attempts),
                        'usernames_attempted': list(set(a.username for a in attempts)),
                        'latest_attempt': max(a.login_timestamp for a in attempts).isoformat() if attempts else None
                    })
            
            return suspicious
        finally:
            session.close()
