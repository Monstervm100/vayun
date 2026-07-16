import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..core.deps import get_current_user
from ..db import get_db
from ..models import FamilyInvite, FamilyLink, Game, ProgressBlob, User
from ..schemas import AcceptInviteIn, ChildSummary, InviteOut

router = APIRouter(prefix="/family", tags=["family"])

INVITE_TTL = timedelta(days=7)


@router.post("/invite", response_model=InviteOut, status_code=201)
def create_invite(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """A child generates a code their parent redeems to link accounts."""
    code = secrets.token_hex(4).upper()
    db.add(FamilyInvite(code=code, child_id=user.id))
    db.commit()
    return InviteOut(code=code)


@router.post("/accept", response_model=ChildSummary)
def accept_invite(body: AcceptInviteIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    invite = db.get(FamilyInvite, body.code.upper())
    if invite is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Invalid invite code")
    created = invite.created_at if invite.created_at.tzinfo else invite.created_at.replace(tzinfo=timezone.utc)
    if datetime.now(timezone.utc) - created > INVITE_TTL:
        raise HTTPException(status.HTTP_410_GONE, "Invite code expired")
    if invite.child_id == user.id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Cannot link to yourself")
    existing = db.scalar(
        select(FamilyLink).where(FamilyLink.parent_id == user.id, FamilyLink.child_id == invite.child_id)
    )
    if existing is None:
        db.add(FamilyLink(parent_id=user.id, child_id=invite.child_id))
    if user.role == "student":
        user.role = "parent"
    child = db.get(User, invite.child_id)
    db.delete(invite)
    db.commit()
    return ChildSummary(id=child.id, display_name=child.display_name, current_rating=child.current_rating)


@router.get("/children", response_model=list[ChildSummary])
def list_children(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    links = db.scalars(select(FamilyLink).where(FamilyLink.parent_id == user.id))
    out = []
    for link in links:
        child = db.get(User, link.child_id)
        if child:
            out.append(ChildSummary(id=child.id, display_name=child.display_name, current_rating=child.current_rating))
    return out


@router.get("/children/{child_id}/report")
def child_report(child_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    link = db.scalar(select(FamilyLink).where(FamilyLink.parent_id == user.id, FamilyLink.child_id == child_id))
    if link is None:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not linked to this child")
    child = db.get(User, child_id)
    blob = db.get(ProgressBlob, child_id)
    games = list(db.scalars(select(Game).where(Game.user_id == child_id).order_by(Game.played_at.desc()).limit(20)))
    return {
        "child": ChildSummary(id=child.id, display_name=child.display_name, current_rating=child.current_rating),
        "progress": (blob.data if blob else {}),
        "recent_games": [
            {"result": g.result, "accuracy": g.accuracy, "engine_level": g.engine_level, "played_at": g.played_at.isoformat()}
            for g in games
        ],
    }
