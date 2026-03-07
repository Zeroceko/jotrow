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
    username: str
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    username: str
    share_code: str

class Token(BaseModel):
    access_token: str
    token_type: str

def generate_share_code() -> str:
    return '1234'

@router.post("/register", response_model=UserResponse)
def register(
    user_in: UserRegister,
    db: Session = Depends(deps.get_db),
) -> Any:
    """
    Create new user with unique 4-digit share code.
    """
    user = db.query(models.User).filter(models.User.username == user_in.username).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this username already exists in the system.",
        )
    
    # Generate unique 4 digit code (currently hardcoded for testing)
    code = generate_share_code()
            
    user = models.User(
        username=user_in.username,
        hashed_password=security.get_password_hash(user_in.password),
        share_code=code,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.post("/login", response_model=Token)
def login_access_token(
    db: Session = Depends(deps.get_db), form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
        
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            user.id, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }
