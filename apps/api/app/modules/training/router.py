from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, require_care_associate
from app.modules.care.models import CareManager
from app.modules.training.models import StaffDocument, StaffTrainingProgress, TrainingModule, TrainingStatus
from app.modules.training.schemas import StaffDocumentResponse, TrainingHomeResponse, TrainingModuleResponse
from app.modules.users.models import User

router = APIRouter()


async def _care_manager(db: AsyncSession, user_id: UUID) -> CareManager:
    result = await db.execute(select(CareManager).where(CareManager.user_id == user_id))
    row = result.scalar_one_or_none()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Care profile not found")
    return row


@router.get("/", response_model=TrainingHomeResponse)
async def training_home(
    current_user: User = Depends(require_care_associate),
    db: AsyncSession = Depends(get_db),
):
    cm = await _care_manager(db, current_user.id)
    modules = list((await db.execute(select(TrainingModule).order_by(TrainingModule.title.asc()))).scalars().all())
    progress_rows = list(
        (
            await db.execute(select(StaffTrainingProgress).where(StaffTrainingProgress.care_manager_id == cm.id))
        ).scalars().all()
    )
    progress_by_module = {row.module_id: row.status for row in progress_rows}
    docs = list(
        (await db.execute(select(StaffDocument).where(StaffDocument.care_manager_id == cm.id))).scalars().all()
    )
    return TrainingHomeResponse(
        modules=[
            TrainingModuleResponse(
                id=module.id,
                title=module.title,
                status=progress_by_module.get(module.id, TrainingStatus.PENDING),
            )
            for module in modules
        ],
        documents=[StaffDocumentResponse.model_validate(doc) for doc in docs],
    )
