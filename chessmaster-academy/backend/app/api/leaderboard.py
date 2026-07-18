from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..core.deps import get_current_user
from ..db import get_db
from ..models import PuzzleAttempt, User
from ..schemas import LeaderboardRow

router = APIRouter(prefix="/leaderboard", tags=["leaderboard"])


@router.get("", response_model=list[LeaderboardRow])
def leaderboard(
    scope: str = "weekly_puzzles",
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if scope == "rating":
        rows = db.execute(
            select(User.display_name, User.current_rating).order_by(User.current_rating.desc()).limit(20)
        ).all()
        return [LeaderboardRow(display_name=n, value=v) for n, v in rows]

    # default: puzzles solved in the last 7 days
    week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    rows = db.execute(
        select(User.display_name, func.count(PuzzleAttempt.id).label("solved"))
        .join(PuzzleAttempt, PuzzleAttempt.user_id == User.id)
        .where(PuzzleAttempt.solved.is_(True), PuzzleAttempt.attempted_at >= week_ago)
        .group_by(User.id)
        .order_by(func.count(PuzzleAttempt.id).desc())
        .limit(20)
    ).all()
    return [LeaderboardRow(display_name=n, value=v) for n, v in rows]
