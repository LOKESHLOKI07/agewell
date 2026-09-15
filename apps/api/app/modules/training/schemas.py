from typing import Optional

from pydantic import UUID4, BaseModel, ConfigDict

from app.modules.training.models import TrainingStatus


class TrainingModuleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID4
    title: str
    status: TrainingStatus


class StaffDocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID4
    title: str
    verified: str


class TrainingHomeResponse(BaseModel):
    modules: list[TrainingModuleResponse]
    documents: list[StaffDocumentResponse]
