from typing import Generator

from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from pydantic import ValidationError
from sqlalchemy.orm import Session
from typing import Optional

from app import models
from app.core import security
from app.core.config import settings
from app.db.session import SessionLocal

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"/auth/login"
)

def get_db() -> Generator:
    try:
        db = SessionLocal()
        yield db
    finally:
        db.close()

def get_current_user(
    db: Session = Depends(get_db), token: str = Depends(reusable_oauth2)
) -> models.User:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        token_sub = payload.get("sub")
        if token_sub is None:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Could not validate credentials")
    except (JWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    # Support both regular tokens ("123") and guest tokens ("guest:123" or "guest:123:code")
    provided_share_code = None
    if isinstance(token_sub, str) and token_sub.startswith("guest:"):
        parts = token_sub.split(":")
        user_id = int(parts[1])
        if len(parts) > 2:
            provided_share_code = parts[2]
    else:
        user_id = int(token_sub)
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Attach for downstream use
    setattr(user, "guest_share_code", provided_share_code)
    return user

def get_optional_current_user(
    request: Request, db: Session = Depends(get_db)
) -> Optional[models.User]:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        token_sub = payload.get("sub")
        if token_sub is None:
            return None
    except (JWTError, ValidationError):
        return None
        
    provided_share_code = None
    if isinstance(token_sub, str) and token_sub.startswith("guest:"):
        parts = token_sub.split(":")
        user_id = int(parts[1])
        if len(parts) > 2:
            provided_share_code = parts[2]
    else:
        user_id = int(token_sub)
        
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user:
        setattr(user, "guest_share_code", provided_share_code)
    return user
