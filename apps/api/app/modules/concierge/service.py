from __future__ import annotations

from typing import Any

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.access.service import AccessService
from app.modules.care.activity_service import CareActivityService
from app.modules.concierge.catalog import SERVICES_BY_SLUG, resolve_navigate_href
from app.modules.concierge.fallback import parse_intent_fallback
from app.modules.concierge.gemini import understand_with_gemini
from app.modules.concierge.schemas import (
    CardLine,
    ConciergeConfirmResponse,
    ConciergeIntent,
    ConciergeTurnResponse,
    ConfirmationCard,
)
from app.modules.concierge.store import (
    append_turn,
    create_confirmation,
    get_history,
    get_or_create_session,
    pop_confirmation,
)
from app.modules.deliveries.service import DeliveryService
from app.modules.memberships.service import MembershipService
from app.modules.services.schemas import ServiceRequestCreate
from app.modules.services.service import ServiceManager
from app.modules.users.models import User

DEMO_MEDICINES = [
    "Metformin 500 mg",
    "Amlodipine 5 mg",
    "Atorvastatin 10 mg",
]

QUICK_ACTIONS = [
    {"id": "medicine", "label": "Medicines", "prompt": "I need my medicines"},
    {"id": "care", "label": "Care Manager", "prompt": "Call my care manager"},
    {"id": "companion", "label": "Companion", "prompt": "I need a companion to visit me"},
    {"id": "grocery", "label": "Groceries", "prompt": "Get groceries for me"},
    {"id": "doctor", "label": "Doctor visit", "prompt": "I need a doctor visit"},
    {"id": "transport", "label": "Transport", "prompt": "I need local transport"},
    {"id": "home", "label": "Home repair", "prompt": "I need house maintenance"},
    {"id": "services", "label": "All services", "prompt": "What services can you help with?"},
]

LEGACY_SLUG = {
    ConciergeIntent.medicine_order: "medicine",
    ConciergeIntent.grocery_order: "grocery",
    ConciergeIntent.companion_visit: "companion",
    ConciergeIntent.transport: "local-transport",
    ConciergeIntent.home_service: "home-repair",
}

ICON_BY_SLUG = {
    "medicine": "medkit",
    "grocery": "cart",
    "companion": "people",
    "care-manager": "call",
    "local-transport": "car",
    "transport": "car",
    "home-repair": "home",
    "doctor": "medkit",
    "health-check": "medkit",
    "monthly-blood-test": "medkit",
    "pooja": "sparkles",
    "legal": "sparkles",
    "banking-companion": "people",
    "small-errands": "home",
    "errand-coordination": "home",
}


class ConciergeService:
    def __init__(
        self,
        db: AsyncSession,
        access: AccessService,
        memberships: MembershipService,
        deliveries: DeliveryService,
        services: ServiceManager,
        care_activities: CareActivityService,
    ):
        self.db = db
        self.access = access
        self.memberships = memberships
        self.deliveries = deliveries
        self.services = services
        self.care_activities = care_activities

    async def turn(self, user: User, message: str, session_id: str | None) -> ConciergeTurnResponse:
        senior = await self.access.get_senior_for_user(user)
        sid = str(senior.id)
        session = get_or_create_session(session_id, sid)
        history = get_history(session)
        context = await self._context_summary(senior)
        parsed = await understand_with_gemini(message, context, history)
        if not parsed:
            parsed = parse_intent_fallback(message)

        intent = self._coerce_intent(parsed.get("intent"))
        confidence = float(parsed.get("confidence") or 0.5)
        reply = str(parsed.get("reply") or "I am here. How can I help you?")
        params = parsed.get("parameters") if isinstance(parsed.get("parameters"), dict) else {}

        append_turn(session, "user", message)

        response = await self._build_response(
            user=user,
            senior=senior,
            sid=sid,
            session=session,
            intent=intent,
            confidence=confidence,
            reply=reply,
            params=params,
        )
        append_turn(session, "model", response.reply_text)
        return response

    async def _build_response(
        self,
        *,
        user: User,
        senior: Any,
        sid: str,
        session: str,
        intent: ConciergeIntent,
        confidence: float,
        reply: str,
        params: dict,
    ) -> ConciergeTurnResponse:
        if intent == ConciergeIntent.emergency:
            return ConciergeTurnResponse(
                session_id=session,
                reply_text=reply,
                speak_text=reply,
                intent=intent,
                confidence=confidence,
                client_action="open_sos",
                quick_actions=QUICK_ACTIONS,
            )

        if intent in (ConciergeIntent.chat, ConciergeIntent.clarify):
            return ConciergeTurnResponse(
                session_id=session,
                reply_text=reply,
                speak_text=reply,
                intent=intent,
                confidence=confidence,
                quick_actions=QUICK_ACTIONS,
            )

        if intent == ConciergeIntent.order_status:
            blocks = await self._order_status_blocks(user)
            return ConciergeTurnResponse(
                session_id=session,
                reply_text=reply if blocks else "I do not see an active delivery right now. Would you like to place a new request?",
                speak_text=reply,
                intent=intent,
                confidence=confidence,
                answer_blocks=blocks,
                quick_actions=QUICK_ACTIONS,
            )

        if intent == ConciergeIntent.membership_usage:
            blocks = await self._membership_blocks(senior.id)
            return ConciergeTurnResponse(
                session_id=session,
                reply_text=reply,
                speak_text=reply,
                intent=intent,
                confidence=confidence,
                answer_blocks=blocks,
                quick_actions=QUICK_ACTIONS,
            )

        if intent == ConciergeIntent.navigate:
            path = resolve_navigate_href(
                params.get("navigate_to"),
                params.get("service_slug"),
                fallback="/(tabs)/services",
            )
            return ConciergeTurnResponse(
                session_id=session,
                reply_text=reply,
                speak_text=reply,
                intent=intent,
                confidence=confidence,
                client_action="navigate",
                navigate_to=path,
                quick_actions=QUICK_ACTIONS,
            )

        if intent in (
            ConciergeIntent.care_manager_call,
            ConciergeIntent.escalate_human,
            ConciergeIntent.request_service,
            ConciergeIntent.medicine_order,
            ConciergeIntent.grocery_order,
            ConciergeIntent.companion_visit,
            ConciergeIntent.transport,
            ConciergeIntent.home_service,
        ):
            slug = self._resolve_slug(intent, params)
            if slug == "emergency-sos":
                return ConciergeTurnResponse(
                    session_id=session,
                    reply_text=reply or "I can open Emergency Support for you.",
                    speak_text=reply,
                    intent=ConciergeIntent.emergency,
                    confidence=confidence,
                    client_action="open_sos",
                    quick_actions=QUICK_ACTIONS,
                )

            service = SERVICES_BY_SLUG.get(slug)
            if service and not service["bookable"]:
                path = resolve_navigate_href(service["href"], slug)
                return ConciergeTurnResponse(
                    session_id=session,
                    reply_text=reply or f"I can open {service['title']} for you.",
                    speak_text=reply,
                    intent=ConciergeIntent.navigate,
                    confidence=confidence,
                    client_action="navigate",
                    navigate_to=path,
                    quick_actions=QUICK_ACTIONS,
                )

            card = self._build_card(intent, senior, params, slug)
            proposal = {"intent": intent.value, "parameters": {**params, "service_slug": slug}, "reply": reply}
            confirmation_id = create_confirmation(sid, proposal)
            card.confirmation_id = confirmation_id
            return ConciergeTurnResponse(
                session_id=session,
                reply_text=reply,
                speak_text=reply,
                intent=intent,
                confidence=confidence,
                requires_confirmation=True,
                card=card,
                quick_actions=QUICK_ACTIONS,
            )

        return ConciergeTurnResponse(
            session_id=session,
            reply_text=reply,
            speak_text=reply,
            intent=ConciergeIntent.chat,
            confidence=confidence,
            quick_actions=QUICK_ACTIONS,
        )

    async def confirm(self, user: User, confirmation_id: str, session_id: str | None = None) -> ConciergeConfirmResponse:
        senior = await self.access.get_senior_for_user(user)
        proposal = pop_confirmation(confirmation_id, str(senior.id))
        if not proposal:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This confirmation expired or was already used. Please ask me again.",
            )

        intent = self._coerce_intent(proposal.get("intent"))
        params = proposal.get("parameters") if isinstance(proposal.get("parameters"), dict) else {}
        session = get_or_create_session(session_id, str(senior.id))

        if intent in (ConciergeIntent.care_manager_call, ConciergeIntent.escalate_human) or params.get(
            "service_slug"
        ) == "care-manager":
            activity = await self.care_activities.create_call(user, senior.id)
            reply = "Done. I have asked your Care Manager to call you back during service hours (10 AM – 6 PM)."
            append_turn(session, "model", reply)
            return ConciergeConfirmResponse(
                success=True,
                reply_text=reply,
                speak_text=reply,
                result_type="care_call",
                reference_id=str(activity.id),
                summary={"type": "care_manager_call"},
                navigate_to="/membership/care-manager",
            )

        slug = self._resolve_slug(intent, params)
        service_meta = SERVICES_BY_SLUG.get(slug)
        try:
            service = await self.services.get_service_by_slug(slug)
        except HTTPException:
            raise HTTPException(
                status_code=400,
                detail=f"I could not find the AgeWell service “{slug}”. Please try another service.",
            ) from None

        notes = self._notes_for(intent, params, service_meta["title"] if service_meta else slug)
        created = await self.services.request_service(
            ServiceRequestCreate(senior_id=senior.id, service_id=service.id, notes=notes)
        )
        title = service_meta["title"] if service_meta else service.name
        reply = f"Done — your {title} request is placed. Our team will follow up shortly. Anything else I can help with?"
        append_turn(session, "model", reply)
        return ConciergeConfirmResponse(
            success=True,
            reply_text=reply,
            speak_text=reply,
            result_type="order",
            reference_id=str(created.id),
            summary={
                "service": title,
                "slug": slug,
                "notes": notes,
                "address": senior.address,
            },
            navigate_to=service_meta["href"] if service_meta else f"/membership/{slug}",
        )

    async def _context_summary(self, senior: Any) -> str:
        name = f"{senior.first_name} {senior.last_name}".strip()
        lines = [
            f"Name: {name}",
            f"Address: {senior.address}",
            f"Preferred language: {senior.preferred_language or 'en'}",
        ]
        try:
            membership = await self.memberships.get_current_membership(senior.id)
            lines.append(f"Membership status: {membership.status} ({membership.plan_name})")
        except Exception:
            lines.append("Membership: unknown")
        return "\n".join(lines)

    async def _order_status_blocks(self, user: User) -> list[dict[str, Any]]:
        page = await self.deliveries.list_member_deliveries(user, self.access, limit=5, offset=0)
        blocks: list[dict[str, Any]] = []
        for item in page.items[:3]:
            blocks.append(
                {
                    "type": "delivery",
                    "id": str(item.id),
                    "title": getattr(item, "title", None) or "Delivery",
                    "status": str(getattr(item, "status", "")),
                    "scheduled_at": str(getattr(item, "scheduled_at", "") or ""),
                }
            )
        if not blocks:
            blocks.append(
                {
                    "type": "info",
                    "title": "No active delivery",
                    "status": "none",
                    "detail": "You can ask me to request medicines, groceries, or another service.",
                }
            )
        return blocks

    async def _membership_blocks(self, senior_id) -> list[dict[str, Any]]:
        try:
            usage = await self.memberships.get_current_usage(senior_id)
        except Exception:
            return [{"type": "info", "title": "Membership", "detail": "Could not load usage right now."}]
        blocks = []
        for row in usage[:8]:
            blocks.append(
                {
                    "type": "usage",
                    "title": row.benefit_name,
                    "used": row.used,
                    "limit": row.quota,
                    "remaining": row.remaining,
                }
            )
        if not blocks:
            blocks.append({"type": "info", "title": "Membership", "detail": "No usage details yet."})
        return blocks

    def _resolve_slug(self, intent: ConciergeIntent, params: dict) -> str:
        raw = str(params.get("service_slug") or "").strip()
        if raw in SERVICES_BY_SLUG:
            return raw
        if intent in LEGACY_SLUG:
            return LEGACY_SLUG[intent]
        if intent in (ConciergeIntent.care_manager_call, ConciergeIntent.escalate_human):
            return "care-manager"
        return "companion"

    def _build_card(
        self, intent: ConciergeIntent, senior: Any, params: dict, slug: str
    ) -> ConfirmationCard:
        address = senior.address or "Saved address"
        when = str(params.get("when") or "As soon as possible")
        items_note = str(params.get("items_note") or "")
        meta = SERVICES_BY_SLUG.get(slug)
        title = meta["title"] if meta else "AgeWell service"
        icon = ICON_BY_SLUG.get(slug, "sparkles")

        if intent in (ConciergeIntent.care_manager_call, ConciergeIntent.escalate_human) or slug == "care-manager":
            return ConfirmationCard(
                title="Call Care Manager",
                subtitle="Request a callback from your Care Manager.",
                icon="call",
                lines=[
                    CardLine(label="Service hours", value="10:00 AM – 6:00 PM"),
                    CardLine(label="For", value=f"{senior.first_name} {senior.last_name}".strip()),
                ],
                primary_label="Call Care Manager",
                confirmation_id="",
            )

        if slug == "medicine":
            meds = items_note or ", ".join(DEMO_MEDICINES)
            return ConfirmationCard(
                title="Medicine delivery",
                subtitle="I can place a medicine delivery request for you.",
                icon="medkit",
                lines=[
                    CardLine(label="Medicines", value=meds),
                    CardLine(label="Deliver to", value=address, changeable=True),
                    CardLine(label="When", value=when, changeable=True),
                ],
                confirmation_id="",
            )

        lines = [
            CardLine(label="Service", value=title),
            CardLine(
                label="Details",
                value=items_note or (meta["description"] if meta else "As discussed"),
            ),
            CardLine(label="Address", value=address),
            CardLine(label="When", value=when),
        ]
        if params.get("destination"):
            lines.insert(1, CardLine(label="Destination", value=str(params["destination"])))

        return ConfirmationCard(
            title=title,
            subtitle=f"Confirm to request {title}.",
            icon=icon,
            lines=lines,
            primary_label="Confirm",
            confirmation_id="",
        )

    def _notes_for(self, intent: ConciergeIntent, params: dict, service_title: str) -> str:
        bits = [f"Created via AgeWell Bot for {service_title}."]
        if params.get("items_note"):
            bits.append(f"Details: {params['items_note']}")
        if params.get("when"):
            bits.append(f"When: {params['when']}")
        if params.get("destination"):
            bits.append(f"Destination: {params['destination']}")
        if intent == ConciergeIntent.medicine_order or params.get("service_slug") == "medicine":
            if not params.get("items_note"):
                bits.append("Usual medicines: " + ", ".join(DEMO_MEDICINES))
        return " ".join(bits)

    def _coerce_intent(self, raw: Any) -> ConciergeIntent:
        try:
            return ConciergeIntent(str(raw))
        except Exception:
            return ConciergeIntent.chat
