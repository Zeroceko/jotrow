import datetime
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session
from sqlalchemy import func

from app import models
from app.api import deps
from app.core import security

router = APIRouter()


# ── Schemas ───────────────────────────────────────────────────────────────────

class SettingsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    username: Optional[str]
    email: Optional[str]
    share_code: Optional[str]
    display_name: Optional[str]
    bio: Optional[str]
    university: Optional[str]
    is_profile_public: bool
    paps_balance: int
    total_praise: int


class ProfileUpdate(BaseModel):
    display_name: Optional[str] = None
    bio: Optional[str] = None
    university: Optional[str] = None
    department: Optional[str] = None


class PinUpdate(BaseModel):
    pin: str  # exactly 4 characters


class PrivacyUpdate(BaseModel):
    note_default_visibility: Optional[str] = None  # "private" | "public"
    show_on_explore: Optional[bool] = None
    is_profile_public: Optional[bool] = None


class EmailUpdate(BaseModel):
    new_email: str
    current_password: str


class PasswordUpdate(BaseModel):
    current_password: str
    new_password: str


class TransactionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    type: str
    amount: int
    description: Optional[str]
    created_at: datetime.datetime


class WalletResponse(BaseModel):
    balance: int
    transactions: List[TransactionResponse]


class TopupRequest(BaseModel):
    amount: int


class WithdrawRequest(BaseModel):
    amount: int
    iban: str


class EarningsResponse(BaseModel):
    earned: int
    spent: int
    net: int
    week_start: datetime.datetime
    week_end: datetime.datetime


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/me", response_model=SettingsResponse)
def get_settings(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """Get full settings for the current user."""
    total_praise = db.query(func.sum(models.Note.praise_count)).filter(
        models.Note.owner_id == current_user.id
    ).scalar() or 0

    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "share_code": current_user.share_code,
        "display_name": current_user.display_name,
        "bio": current_user.bio,
        "university": current_user.university,
        "department": current_user.department,
        "note_default_visibility": current_user.note_default_visibility or "private",
        "show_on_explore": current_user.show_on_explore if current_user.show_on_explore is not None else True,
        "is_profile_public": current_user.is_profile_public if current_user.is_profile_public is not None else True,
        "paps_balance": current_user.paps_balance or 0,
        "total_praise": total_praise,
    }


@router.put("/profile", response_model=SettingsResponse)
def update_profile(
    profile_in: ProfileUpdate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """Update public profile fields."""
    if profile_in.display_name is not None:
        current_user.display_name = profile_in.display_name
    if profile_in.bio is not None:
        current_user.bio = profile_in.bio
    if profile_in.university is not None:
        current_user.university = profile_in.university
    if profile_in.department is not None:
        current_user.department = profile_in.department
    db.commit()
    db.refresh(current_user)
    return get_settings(db, current_user)


@router.put("/profile/pin")
def update_pin(
    pin_in: PinUpdate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """Update user's own 4-digit share code (PIN). Must be unique."""
    if len(pin_in.pin) != 4:
        raise HTTPException(status_code=400, detail="PIN must be exactly 4 characters.")
    # Uniqueness check
    existing = db.query(models.User).filter(
        models.User.share_code == pin_in.pin,
        models.User.id != current_user.id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="This PIN is already taken. Please choose another.")
    current_user.share_code = pin_in.pin
    db.commit()
    return {"message": "PIN updated successfully.", "share_code": pin_in.pin}


@router.put("/privacy", response_model=SettingsResponse)
def update_privacy(
    privacy_in: PrivacyUpdate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """Update privacy / visibility settings."""
    if privacy_in.note_default_visibility is not None:
        if privacy_in.note_default_visibility not in ("private", "public"):
            raise HTTPException(status_code=400, detail="visibility must be 'private' or 'public'.")
        current_user.note_default_visibility = privacy_in.note_default_visibility
    if privacy_in.show_on_explore is not None:
        current_user.show_on_explore = privacy_in.show_on_explore
    if privacy_in.is_profile_public is not None:
        current_user.is_profile_public = privacy_in.is_profile_public
    db.commit()
    db.refresh(current_user)
    return get_settings(db, current_user)


@router.put("/account/email")
def update_email(
    email_in: EmailUpdate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """Change account email. Requires current password."""
    if not security.verify_password(email_in.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect current password.")
    existing = db.query(models.User).filter(
        models.User.email == email_in.new_email,
        models.User.id != current_user.id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="This email is already in use.")
    current_user.email = email_in.new_email
    db.commit()
    return {"message": "Email updated successfully."}


@router.put("/account/password")
def update_password(
    password_in: PasswordUpdate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """Change account password. Requires current password."""
    if not security.verify_password(password_in.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect current password.")
    if len(password_in.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters.")
    current_user.hashed_password = security.get_password_hash(password_in.new_password)
    db.commit()
    return {"message": "Password updated successfully."}


@router.get("/wallet", response_model=WalletResponse)
def get_wallet(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """Get PAPS balance and full transaction history."""
    transactions = (
        db.query(models.Transaction)
        .filter(models.Transaction.user_id == current_user.id)
        .order_by(models.Transaction.created_at.desc())
        .all()
    )
    return {
        "balance": current_user.paps_balance or 0,
        "transactions": transactions,
    }


@router.post("/wallet/topup")
def topup_wallet(
    req: TopupRequest,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """Simulate purchasing a PAPS package (250, 500, or 1000)."""
    if req.amount not in (250, 500, 1000):
        raise HTTPException(status_code=400, detail="Invalid package amount. Must be 250, 500, or 1000.")
    
    current_user.paps_balance = (current_user.paps_balance or 0) + req.amount
    
    transaction = models.Transaction(
        user_id=current_user.id,
        type="topup",
        amount=req.amount,
        description=f"Purchased {req.amount} PAPS package"
    )
    db.add(transaction)
    db.commit()
    
    return {"message": f"Successfully purchased {req.amount} PAPS.", "balance": current_user.paps_balance}


@router.post("/wallet/withdraw")
def withdraw_wallet(
    req: WithdrawRequest,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """Withdraw PAPS to an IBAN. Minimum 100 PAPS."""
    if req.amount < 100:
        raise HTTPException(status_code=400, detail="Minimum withdrawal amount is 100 PAPS.")
        
    if not req.iban or len(req.iban.strip()) < 15:
        raise HTTPException(status_code=400, detail="Please provide a valid IBAN.")
        
    current_balance = current_user.paps_balance or 0
    if current_balance < req.amount:
        raise HTTPException(status_code=400, detail="Insufficient PAPS balance.")
        
    current_user.paps_balance = current_balance - req.amount
    
    transaction = models.Transaction(
        user_id=current_user.id,
        type="withdraw",
        amount=-req.amount,
        description=f"Withdrawal to {req.iban[-4:]}"
    )
    db.add(transaction)
    db.commit()
    
    return {"message": f"Successfully requested withdrawal of {req.amount} PAPS.", "balance": current_user.paps_balance}


@router.get("/earnings", response_model=EarningsResponse)
def get_earnings(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """Get this week's earnings, spending, and net for the current user."""
    now = datetime.datetime.utcnow()
    week_start = now - datetime.timedelta(days=now.weekday())
    week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)
    week_end = week_start + datetime.timedelta(days=7)

    transactions = (
        db.query(models.Transaction)
        .filter(
            models.Transaction.user_id == current_user.id,
            models.Transaction.created_at >= week_start,
            models.Transaction.created_at < week_end,
        )
        .all()
    )

    earned = sum(t.amount for t in transactions if t.amount > 0 and t.type == "sale")
    spent = abs(sum(t.amount for t in transactions if t.amount < 0 and t.type == "purchase"))
    net = earned - spent

    return {
        "earned": earned,
        "spent": spent,
        "net": net,
        "week_start": week_start,
        "week_end": week_end,
    }
