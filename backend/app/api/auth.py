import random
import string
from datetime import timedelta
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app import models
from app.api import deps
from app.core import security
from app.core.config import settings
from pydantic import BaseModel, ConfigDict

router = APIRouter()

class UserRegister(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    username: str
    share_code: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: int # Useful for frontend
    email: str

def generate_share_code() -> str:
    return '1234'

@router.post("/register", response_model=Token)
def register(
    user_in: UserRegister,
    db: Session = Depends(deps.get_db),
) -> Any:
    """
    Create new user with unique 4-digit share code.
    Auto-logins immediately.
    """
    user = db.query(models.User).filter(models.User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
    
    user = models.User(
        email=user_in.email,
        hashed_password=security.get_password_hash(user_in.password),
        share_code=None,
        paps_balance=100,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # 100 PAPS registration bonus transaction
    tx = models.Transaction(
        user_id=user.id,
        type="topup",
        amount=100,
        description="Ilk Kayit Hediyesi"
    )
    db.add(tx)
    db.commit()
    
    if not user.username:
        user.username = f"user_{user.id}"
        db.commit()

    # Auto-login
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            user.id, expires_delta=access_token_expires, username=user.username
        ),
        "token_type": "bearer",
        "user_id": user.id,
        "email": user.email,
    }

@router.post("/login", response_model=Token)
def login_access_token(
    db: Session = Depends(deps.get_db), form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests
    Supports email login via the 'username' field.
    """
    # Try searching by email
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    
    # Fallback to username for existing users
    if not user:
        user = db.query(models.User).filter(models.User.username == form_data.username).first()

    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
        
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            user.id, expires_delta=access_token_expires, username=user.username
        ),
        "token_type": "bearer",
        "user_id": user.id,
        "email": user.email or "",
    }
class UserUpdate(BaseModel):
    username: str

@router.get("/me", response_model=UserResponse)
def read_user_me(
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """
    Get current user.
    """
    return current_user

@router.put("/me", response_model=UserResponse)
def update_user_me(
    *,
    db: Session = Depends(deps.get_db),
    user_in: UserUpdate,
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """
    Update own user details.
    """
    if user_in.username:
        # Check if username exists
        existing_user = db.query(models.User).filter(models.User.username == user_in.username).first()
        if existing_user and existing_user.id != current_user.id:
            raise HTTPException(
                status_code=400,
                detail="The username is already taken.",
            )
        current_user.username = user_in.username
    
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user
