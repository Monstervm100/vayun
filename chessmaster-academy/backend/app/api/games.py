from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..core.deps import get_current_user
from ..db import get_db
from ..models import Game, User
from ..schemas import GameIn, GameOut

router = APIRouter(prefix="/games", tags=["games"])


@router.post("", response_model=GameOut, status_code=201)
def create_game(body: GameIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    game = Game(user_id=user.id, **body.model_dump())
    db.add(game)
    db.commit()
    return game


@router.get("", response_model=list[GameOut])
def list_games(
    limit: int = 50,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    stmt = select(Game).where(Game.user_id == user.id).order_by(Game.played_at.desc()).limit(min(limit, 200))
    return list(db.scalars(stmt))


@router.get("/{game_id}", response_model=GameOut)
def get_game(game_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    game = db.get(Game, game_id)
    if game is None or game.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Game not found")
    return game
