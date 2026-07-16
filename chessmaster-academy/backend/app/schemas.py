from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    display_name: str = Field(min_length=1, max_length=64)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class GoogleIn(BaseModel):
    id_token: str


class RefreshIn(BaseModel):
    refresh_token: str


class TokenOut(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: str
    email: EmailStr
    display_name: str
    role: str
    age: int | None = None
    experience_level: str | None = None
    current_rating: int
    target_rating: int
    favorite_opening: str | None = None
    weekly_goal_minutes: int
    daily_minutes: int
    learning_style: str | None = None

    model_config = {"from_attributes": True}


class UserPatch(BaseModel):
    display_name: str | None = Field(None, min_length=1, max_length=64)
    age: int | None = Field(None, ge=4, le=120)
    experience_level: str | None = None
    current_rating: int | None = Field(None, ge=100, le=3500)
    target_rating: int | None = Field(None, ge=100, le=3500)
    favorite_opening: str | None = None
    weekly_goal_minutes: int | None = Field(None, ge=10, le=2000)
    daily_minutes: int | None = Field(None, ge=5, le=240)
    learning_style: str | None = None


class SyncIn(BaseModel):
    version: int
    data: dict


class SyncOut(BaseModel):
    version: int
    data: dict
    updated_at: datetime | None = None


class GameIn(BaseModel):
    pgn: str
    result: str
    color: str = "white"
    engine_level: int = 1
    time_control: str | None = None
    accuracy: float | None = None
    analysis: dict | None = None


class GameOut(GameIn):
    id: str
    played_at: datetime

    model_config = {"from_attributes": True}


class PuzzleAttemptIn(BaseModel):
    puzzle_id: str
    theme: str | None = None
    solved: bool
    time_ms: int | None = None


class LeaderboardRow(BaseModel):
    display_name: str
    value: int


class InviteOut(BaseModel):
    code: str


class AcceptInviteIn(BaseModel):
    code: str


class ChildSummary(BaseModel):
    id: str
    display_name: str
    current_rating: int
