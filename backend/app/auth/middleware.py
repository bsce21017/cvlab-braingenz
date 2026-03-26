"""
Authentication Middleware for Custom JWT
Verifies JWT tokens and extracts user information
"""
import logging
from typing import Optional
from fastapi import HTTPException, Depends, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from pydantic import BaseModel

from app.config import settings

logger = logging.getLogger(__name__)

security = HTTPBearer(auto_error=False)


class AuthUser(BaseModel):
    """Authenticated user information extracted from JWT"""
    id: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    role: Optional[str] = "admin"


def decode_jwt(token: str) -> dict:
    """Decode and verify a custom JWT token"""
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except JWTError as e:
        logger.warning(f"JWT decode error: {e}")
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired authentication token"
        )


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    authorization: Optional[str] = Header(None, alias="Authorization")
) -> AuthUser:
    """Get the current authenticated user from JWT"""
    token = None

    if credentials and credentials.credentials:
        token = credentials.credentials
    elif authorization:
        if authorization.startswith("Bearer "):
            token = authorization[7:]
        else:
            token = authorization

    if not token:
        raise HTTPException(
            status_code=401,
            detail="Authentication required"
        )

    payload = decode_jwt(token)

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Invalid token: missing user ID"
        )

    return AuthUser(
        id=user_id,
        email=payload.get("email"),
        full_name=payload.get("full_name"),
        role=payload.get("role", "admin")
    )


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    authorization: Optional[str] = Header(None, alias="Authorization")
) -> Optional[AuthUser]:
    """Optional authentication - returns None if not authenticated"""
    try:
        return await get_current_user(credentials, authorization)
    except HTTPException:
        return None
