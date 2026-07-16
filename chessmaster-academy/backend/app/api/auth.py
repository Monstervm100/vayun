import jwt
import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..core.config import settings
from ..core.security import create_access_token, create_refresh_token, decode_token, hash_password, verify_password
from ..db import get_db
from ..models import User
from ..schemas import GoogleIn, LoginIn, RefreshIn, RegisterIn, TokenOut

router = APIRouter(prefix="/auth", tags=["auth"])


def _tokens(user: User) -> TokenOut:
    return TokenOut(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
    )


@router.post("/register", response_model=TokenOut, status_code=201)
def register(body: RegisterIn, db: Session = Depends(get_db)):
    if db.scalar(select(User).where(User.email == body.email.lower())):
        raise HTTPException(status.HTTP_409_CONFLICT, "Email already registered")
    user = User(
        email=body.email.lower(),
        password_hash=hash_password(body.password),
        display_name=body.display_name,
    )
    db.add(user)
    db.commit()
    return _tokens(user)


@router.post("/login", response_model=TokenOut)
def login(body: LoginIn, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == body.email.lower()))
    if not user or not user.password_hash or not verify_password(body.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password")
    return _tokens(user)


@router.post("/google", response_model=TokenOut)
def google_login(body: GoogleIn, db: Session = Depends(get_db)):
    # Verify the ID token against Google's tokeninfo endpoint.
    resp = httpx.get("https://oauth2.googleapis.com/tokeninfo", params={"id_token": body.id_token}, timeout=10)
    if resp.status_code != 200:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid Google token")
    info = resp.json()
    if settings.google_client_id and info.get("aud") != settings.google_client_id:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token audience mismatch")
    sub, email = info.get("sub"), (info.get("email") or "").lower()
    if not sub or not email:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Incomplete Google token")
    user = db.scalar(select(User).where(User.google_sub == sub)) or db.scalar(
        select(User).where(User.email == email)
    )
    if user is None:
        user = User(email=email, google_sub=sub, display_name=info.get("given_name") or "Player")
        db.add(user)
    else:
        user.google_sub = sub
    db.commit()
    return _tokens(user)


@router.post("/refresh", response_model=TokenOut)
def refresh(body: RefreshIn, db: Session = Depends(get_db)):
    try:
        payload = decode_token(body.refresh_token, "refresh")
    except jwt.PyJWTError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid refresh token")
    user = db.get(User, payload["sub"])
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User not found")
    return _tokens(user)
