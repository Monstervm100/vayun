from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..core.deps import get_current_user
from ..db import get_db
from ..models import ProgressBlob, PuzzleAttempt, User
from ..schemas import PuzzleAttemptIn, SyncIn, SyncOut

router = APIRouter(prefix="/progress", tags=["progress"])


@router.get("/sync", response_model=SyncOut)
def get_sync(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    blob = db.get(ProgressBlob, user.id)
    if blob is None:
        return SyncOut(version=0, data={})
    return SyncOut(version=blob.version, data=blob.data, updated_at=blob.updated_at)


@router.put("/sync", response_model=SyncOut)
def put_sync(body: SyncIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    blob = db.get(ProgressBlob, user.id)
    if blob is None:
        blob = ProgressBlob(user_id=user.id, version=1, data=body.data)
        db.add(blob)
    else:
        # Optimistic concurrency: client must send the version it last saw.
        if body.version != blob.version:
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                detail={"message": "Version conflict", "server_version": blob.version, "server_data": blob.data},
            )
        blob.data = body.data
        blob.version += 1
    db.commit()
    return SyncOut(version=blob.version, data=blob.data, updated_at=blob.updated_at)


@router.post("/puzzle-attempts", status_code=201)
def record_attempt(body: PuzzleAttemptIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.add(PuzzleAttempt(user_id=user.id, **body.model_dump()))
    db.commit()
    return {"ok": True}
