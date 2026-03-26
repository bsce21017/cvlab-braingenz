"""
User Service
Handles user management via admin_users table in Azure PostgreSQL
(Replaces the old Supabase-based service)
"""
import logging
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.models.admin_user import AdminUser

logger = logging.getLogger(__name__)


class SupabaseService:
    """Service for user management operations using admin_users table.
    Keeps the class name for backward compatibility with existing code."""

    def _get_db(self) -> Session:
        return SessionLocal()

    async def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user details by ID"""
        db = self._get_db()
        try:
            user = db.query(AdminUser).filter(AdminUser.id == int(user_id)).first()
            if not user:
                logger.info(f"User {user_id} not found")
                return None

            return {
                'id': str(user.id),
                'email': user.email,
                'full_name': user.full_name,
                'role': user.role,
                'status': 'active' if user.is_active else 'inactive',
                'created_at': user.created_at.isoformat() if user.created_at else None,
                'last_sign_in_at': user.updated_at.isoformat() if user.updated_at else None,
                'email_confirmed_at': user.created_at.isoformat() if user.created_at else None,
            }
        except Exception as e:
            logger.error(f"Error fetching user: {e}")
            return None
        finally:
            db.close()

    async def list_users(
        self,
        page: int = 1,
        per_page: int = 50
    ) -> Dict[str, Any]:
        """List all users with pagination"""
        db = self._get_db()
        try:
            offset = (page - 1) * per_page
            users_query = db.query(AdminUser).order_by(AdminUser.created_at.desc())
            total = users_query.count()
            users_list = users_query.offset(offset).limit(per_page).all()

            users = []
            for user in users_list:
                users.append({
                    'id': str(user.id),
                    'email': user.email,
                    'full_name': user.full_name,
                    'role': user.role,
                    'status': 'active' if user.is_active else 'inactive',
                    'created_at': user.created_at.isoformat() if user.created_at else None,
                    'last_sign_in_at': user.updated_at.isoformat() if user.updated_at else None,
                    'banned_until': None if user.is_active else '2099-01-01T00:00:00',
                })

            logger.info(f"Listed {len(users)} users (page {page}, total: {total})")
            return {
                "users": users,
                "total": total
            }
        except Exception as e:
            logger.error(f"Error listing users: {e}")
            return {"users": [], "total": 0}
        finally:
            db.close()

    async def update_user_status(self, user_id: str, status: str) -> bool:
        """Update user status (active/inactive)"""
        db = self._get_db()
        try:
            user = db.query(AdminUser).filter(AdminUser.id == int(user_id)).first()
            if not user:
                logger.error(f"User {user_id} not found")
                return False

            user.is_active = (status == 'active')
            db.commit()
            logger.info(f"User {user_id} status updated to {status}")
            return True
        except Exception as e:
            db.rollback()
            logger.error(f"Error updating user status: {e}")
            return False
        finally:
            db.close()

    async def delete_user(self, user_id: str) -> bool:
        """Delete a user"""
        db = self._get_db()
        try:
            user = db.query(AdminUser).filter(AdminUser.id == int(user_id)).first()
            if not user:
                logger.error(f"User {user_id} not found")
                return False

            db.delete(user)
            db.commit()
            logger.info(f"User {user_id} deleted")
            return True
        except Exception as e:
            db.rollback()
            logger.error(f"Error deleting user: {e}")
            return False
        finally:
            db.close()

    async def update_user_role(self, user_id: str, role: str) -> bool:
        """Update user role"""
        db = self._get_db()
        try:
            user = db.query(AdminUser).filter(AdminUser.id == int(user_id)).first()
            if not user:
                logger.error(f"User {user_id} not found")
                return False

            user.role = role
            db.commit()
            logger.info(f"User {user_id} role updated to {role}")
            return True
        except Exception as e:
            db.rollback()
            logger.error(f"Error updating user role: {e}")
            return False
        finally:
            db.close()
