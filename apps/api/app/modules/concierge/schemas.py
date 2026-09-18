from enum import Enum
from typing import Any, Optional

from pydantic import BaseModel, Field


class ConciergeIntent(str, Enum):
    chat = "chat"
    emergency = "emergency"
    care_manager_call = "care_manager_call"
    request_service = "request_service"
    medicine_order = "medicine_order"
    grocery_order = "grocery_order"
    companion_visit = "companion_visit"
    transport = "transport"
    home_service = "home_service"
    order_status = "order_status"
    membership_usage = "membership_usage"
    navigate = "navigate"
    clarify = "clarify"
    escalate_human = "escalate_human"


class ConciergeTurnRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    session_id: Optional[str] = None
    input_mode: str = "text"


class CardLine(BaseModel):
    label: str
    value: str
    changeable: bool = False


class ConfirmationCard(BaseModel):
    title: str
    subtitle: Optional[str] = None
    icon: str = "sparkles"
    lines: list[CardLine] = Field(default_factory=list)
    primary_label: str = "Continue"
    secondary_label: str = "Cancel"
    confirmation_id: str


class ConciergeTurnResponse(BaseModel):
    session_id: str
    reply_text: str
    speak_text: Optional[str] = None
    intent: ConciergeIntent
    confidence: float = 0.0
    requires_confirmation: bool = False
    card: Optional[ConfirmationCard] = None
    client_action: Optional[str] = None  # open_sos | navigate
    navigate_to: Optional[str] = None
    answer_blocks: list[dict[str, Any]] = Field(default_factory=list)
    quick_actions: list[dict[str, str]] = Field(default_factory=list)


class ConciergeConfirmRequest(BaseModel):
    confirmation_id: str
    session_id: Optional[str] = None


class ConciergeConfirmResponse(BaseModel):
    success: bool
    reply_text: str
    speak_text: Optional[str] = None
    result_type: str  # order | care_call | navigate | info
    reference_id: Optional[str] = None
    summary: dict[str, Any] = Field(default_factory=dict)
    navigate_to: Optional[str] = None
