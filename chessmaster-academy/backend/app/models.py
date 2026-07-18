import uuid
from datetime import datetime, timezone

from sqlalchemy import JSON, Boolean, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


def _uuid() -> str:
    return uuid.uuid4().hex


def _now() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_uuid)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    google_sub: Mapped[str | None] = mapped_column(String(64), unique=True, nullable=True)
    display_name: Mapped[str] = mapped_column(String(64), default="Player")
    role: Mapped[str] = mapped_column(String(16), default="student")  # student|parent|teacher|admin
    # Onboarding profile
    age: Mapped[int | None] = mapped_column(Integer, nullable=True)
    experience_level: Mapped[str | None] = mapped_column(String(32), nullable=True)
    current_rating: Mapped[int] = mapped_column(Integer, default=400)
    target_rating: Mapped[int] = mapped_column(Integer, default=1200)
    favorite_opening: Mapped[str | None] = mapped_column(String(64), nullable=True)
    weekly_goal_minutes: Mapped[int] = mapped_column(Integer, default=90)
    daily_minutes: Mapped[int] = mapped_column(Integer, default=15)
    learning_style: Mapped[str | None] = mapped_column(String(32), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    games: Mapped[list["Game"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class ProgressBlob(Base):
    """Versioned bulk sync of the client learning store (guest-first architecture)."""

    __tablename__ = "progress_blobs"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), primary_key=True)
    version: Mapped[int] = mapped_column(Integer, default=0)
    data: Mapped[dict] = mapped_column(JSON, default=dict)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)


class Game(Base):
    __tablename__ = "games"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    pgn: Mapped[str] = mapped_column(Text)
    result: Mapped[str] = mapped_column(String(8))  # 1-0 | 0-1 | 1/2-1/2 | *
    color: Mapped[str] = mapped_column(String(5), default="white")
    engine_level: Mapped[int] = mapped_column(Integer, default=1)
    time_control: Mapped[str | None] = mapped_column(String(16), nullable=True)
    accuracy: Mapped[float | None] = mapped_column(Float, nullable=True)
    analysis: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    played_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    user: Mapped[User] = relationship(back_populates="games")


class PuzzleAttempt(Base):
    __tablename__ = "puzzle_attempts"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    puzzle_id: Mapped[str] = mapped_column(String(64))
    theme: Mapped[str | None] = mapped_column(String(32), nullable=True)
    solved: Mapped[bool] = mapped_column(Boolean)
    time_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    attempted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)


class FamilyLink(Base):
    __tablename__ = "family_links"
    __table_args__ = (UniqueConstraint("parent_id", "child_id"),)

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_uuid)
    parent_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    child_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    status: Mapped[str] = mapped_column(String(16), default="active")


class FamilyInvite(Base):
    __tablename__ = "family_invites"

    code: Mapped[str] = mapped_column(String(8), primary_key=True)
    child_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
