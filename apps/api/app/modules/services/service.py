import json

from fastapi import HTTPException, status

from app.modules.audit.repository import AuditRepository
from app.modules.services.models import ServiceRequestStatus
from app.modules.services.repository import ServiceRepository
from app.modules.services.schemas import (
    ServiceCreate,
    ServiceRequestCreate,
    ServiceRequestRead,
    ServiceUpdate,
)


def _person_name(first_name, last_name) -> str | None:
    parts = [part.strip() for part in (first_name, last_name) if part and str(part).strip()]
    return " ".join(parts) if parts else None


def _delivery_location(senior) -> str | None:
    """Human address plus optional @lat,lng pin for companion navigation."""
    address = (getattr(senior, "address", None) or "").strip() or None
    lat = getattr(senior, "location_lat", None)
    lng = getattr(senior, "location_lng", None)
    try:
        if lat is not None and lng is not None:
            pin = f"@{float(lat):.6f},{float(lng):.6f}"
            return f"{address} · {pin}" if address else pin
    except (TypeError, ValueError):
        pass
    return address


class ServiceManager:
    def __init__(self, repo: ServiceRepository, audit_repo: AuditRepository | None = None):
        self.repo = repo
        self.audit_repo = audit_repo

    async def create_service(self, item: ServiceCreate):
        service = await self.repo.create_service(item)
        if self.audit_repo:
            await self.audit_repo.record(
                entity_name="services",
                entity_id=str(service.id),
                action="CREATE",
                changes=json.dumps({"name": service.name, "category": service.category.value if service.category else None}),
            )
            await self.repo.session.commit()
        return service

    async def get_services(self):
        return await self.repo.get_all_services()

    async def get_service_by_slug(self, slug: str):
        service = await self.repo.get_by_slug(slug)
        if not service:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")
        return service

    async def update_service(self, service_id, payload: ServiceUpdate):
        service = await self.repo.get_by_id(service_id)
        if not service:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")
        data = payload.model_dump(exclude_unset=True)
        service = await self.repo.update_service(service, data)
        if self.audit_repo:
            await self.audit_repo.record(
                entity_name="services",
                entity_id=str(service.id),
                action="UPDATE",
                changes=json.dumps({k: str(v) for k, v in data.items()}),
            )
            await self.repo.session.commit()
        return service

    async def request_service(self, req: ServiceRequestCreate):
        service = await self.repo.get_by_id(req.service_id)
        if not service:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")
        created = await self.repo.create_request(req)
        await self._maybe_auto_assign_standing(created, service)
        refreshed = await self.repo.get_request_by_id(created.id)
        if refreshed:
            await self._maybe_auto_dispatch_to_standing_companion(refreshed, service)
            refreshed = await self.repo.get_request_by_id(created.id)
        row = refreshed or created
        return await self._to_read(row, service)

    async def auto_assign_standing(self, request_id, *, actor=None) -> ServiceRequestRead:
        """Assign standing CM/Companion (or soft-dispatch Companion) without a manual Confirm step."""
        from app.modules.services.service_policy import needs_service_companion_dispatch

        request = await self.repo.get_request_by_id(request_id)
        if not request:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service request not found")
        if request.status in (ServiceRequestStatus.COMPLETED, ServiceRequestStatus.CANCELLED):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This request is already closed.",
            )
        service = await self.repo.get_by_id(request.service_id)
        if not service:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")

        await self._maybe_auto_assign_standing(request, service)
        refreshed = await self.repo.get_request_by_id(request.id)
        if refreshed:
            await self._maybe_auto_dispatch_to_standing_companion(refreshed, service)
            refreshed = await self.repo.get_request_by_id(request.id)
        row = refreshed or request
        slug = service.slug if service else None
        routed = bool(getattr(row, "executor_id", None) or getattr(row, "dispatcher_id", None))
        if row.status == ServiceRequestStatus.REQUESTED or not routed:
            if needs_service_companion_dispatch(slug):
                detail = "No standing Companion on this senior. Assign manually."
            else:
                detail = "No standing Care Manager or Companion on this senior. Assign manually."
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)
        return await self._to_read(row, service)

    async def unassigned_counts(self, *, service_city: str | None = None) -> dict[str, int]:
        return await self.repo.unassigned_counts_by_slug(service_city=service_city)

    async def list_requests(self, **kwargs):
        from app.api.schemas import ListPage

        rows, total = await self.repo.list_requests(**kwargs)
        items = [
            self._read_from_row(request, service_name, service_slug, first_name, last_name)
            for request, service_name, service_slug, first_name, last_name in rows
        ]
        return ListPage(
            items=items,
            total=total,
            limit=kwargs.get("limit", 50),
            offset=kwargs.get("offset", 0),
        )

    async def update_request_status(
        self,
        request_id,
        new_status: ServiceRequestStatus,
        *,
        actor=None,
        proof_photo: str | None = None,
    ) -> ServiceRequestRead:
        request = await self.repo.get_request_by_id(request_id)
        if not request:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service request not found")
        service = await self.repo.get_by_id(request.service_id)
        slug = service.slug if service else None
        if new_status == ServiceRequestStatus.COMPLETED:
            from app.modules.care.repository import CareManagerRepository
            from app.modules.services.service_policy import ensure_can_finish, ensure_proof_photo, policy_role_for_user

            staff_kind = None
            if actor is not None:
                profile = await CareManagerRepository(self.repo.session).get_by_user_id(actor.id)
                staff_kind = profile.staff_kind if profile else None
            ensure_can_finish(slug, policy_role_for_user(actor, staff_kind))
            ensure_proof_photo(slug, proof_photo or getattr(request, "proof_photo", None))
        updates = {"status": new_status}
        if proof_photo:
            updates["proof_photo"] = proof_photo
        request = await self.repo.update_request(request, updates)
        if self.audit_repo:
            await self.audit_repo.record(
                entity_name="service_requests",
                entity_id=str(request.id),
                action="UPDATE",
                changes=json.dumps({"status": new_status.value}),
            )
            await self.repo.session.commit()
        return await self._to_read(request, service)

    async def assign_request(self, request_id, care_manager_ids, *, actor=None) -> ServiceRequestRead:
        from app.modules.care.repository import CareManagerRepository
        from app.modules.seniors.repository import SeniorRepository
        from app.modules.services.service_policy import (
            ROLE_CARE_MANAGER,
            ROLE_COMPANION,
            ROLE_SERVICE_COMPANION,
            ensure_can_assign,
            is_desk_only_service,
            needs_service_companion_dispatch,
            policy_role_for_staff_kind,
        )
        from app.modules.users.models import RoleEnum

        ids = list(dict.fromkeys(care_manager_ids or []))
        if not ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Select at least one person to assign.",
            )

        request = await self.repo.get_request_by_id(request_id)
        if not request:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service request not found")
        if request.status in (ServiceRequestStatus.COMPLETED, ServiceRequestStatus.CANCELLED):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This request is already closed.",
            )
        service = await self.repo.get_by_id(request.service_id)
        slug = service.slug if service else None
        if is_desk_only_service(slug):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This service is handled in the inbox. It is not assigned to field staff.",
            )

        care_repo = CareManagerRepository(self.repo.session)
        actor_is_field_cm = False
        if actor is not None:
            if actor.role in (RoleEnum.ADMIN, RoleEnum.OPERATIONS):
                pass
            elif actor.role == RoleEnum.CARE_MANAGER:
                actor_profile = await care_repo.get_by_user_id(actor.id)
                if (
                    not actor_profile
                    or policy_role_for_staff_kind(actor_profile.staff_kind) != ROLE_CARE_MANAGER
                ):
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Only Care Managers can assign field staff.",
                    )
                actor_is_field_cm = True
            else:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not enough permissions",
                )

        assignees = []
        for care_manager_id in ids:
            assignee = await care_repo.get_by_id(care_manager_id)
            if not assignee:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Care associate not found")
            if (assignee.status or "").upper() != "ACTIVE":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Only ACTIVE care associates can be assigned.",
                )
            assignee_role = policy_role_for_staff_kind(assignee.staff_kind)
            if actor_is_field_cm and assignee_role not in (ROLE_COMPANION, ROLE_SERVICE_COMPANION):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Care Managers can only assign Companions or Service Companions.",
                )
            soft_dispatcher = needs_service_companion_dispatch(slug) and assignee_role in (
                ROLE_COMPANION,
                ROLE_CARE_MANAGER,
            )
            if not soft_dispatcher:
                ensure_can_assign(
                    slug,
                    assignee_role,
                    companion_service_slugs=getattr(assignee, "companion_service_slugs", None),
                )
            assignees.append((assignee, assignee_role))

        senior = await SeniorRepository(self.repo.session).get_by_id(request.senior_id)
        senior_name = _person_name(getattr(senior, "first_name", None), getattr(senior, "last_name", None))

        if needs_service_companion_dispatch(slug):
            sc_assignees = [a for a, role in assignees if role == ROLE_SERVICE_COMPANION]
            dispatchers = [a for a, role in assignees if role in (ROLE_COMPANION, ROLE_CARE_MANAGER)]
            if sc_assignees:
                await self._create_jobs_for_assignees(
                    request, service, slug, senior, senior_name, sc_assignees
                )
                updates = {
                    "status": ServiceRequestStatus.ASSIGNED,
                    "executor_id": sc_assignees[0].id,
                    "dispatcher_id": dispatchers[0].id if dispatchers else getattr(request, "dispatcher_id", None),
                }
            elif dispatchers:
                updates = {
                    "status": ServiceRequestStatus.ASSIGNED,
                    "dispatcher_id": dispatchers[0].id,
                    "executor_id": None,
                }
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Assign a Companion, Care Manager, or Service Companion.",
                )
            request = await self.repo.update_request(request, updates)
        else:
            only_assignees = [a for a, _ in assignees]
            await self._create_jobs_for_assignees(
                request, service, slug, senior, senior_name, only_assignees
            )
            request = await self.repo.update_request(
                request,
                {
                    "status": ServiceRequestStatus.ASSIGNED,
                    "executor_id": only_assignees[0].id,
                    "dispatcher_id": None,
                },
            )

        if self.audit_repo:
            await self.audit_repo.record(
                entity_name="service_requests",
                entity_id=str(request.id),
                action="ASSIGN",
                changes=json.dumps(
                    {
                        "care_manager_ids": [str(item.id) for item, _ in assignees],
                        "service_slug": slug,
                        "dispatcher_id": str(request.dispatcher_id) if request.dispatcher_id else None,
                        "executor_id": str(request.executor_id) if request.executor_id else None,
                    }
                ),
            )
            await self.repo.session.commit()
        return await self._to_read(request, service, senior_name=senior_name)

    async def take_request(self, request_id, *, actor) -> ServiceRequestRead:
        from app.modules.care.repository import CareManagerRepository
        from app.modules.seniors.repository import SeniorRepository
        from app.modules.services.service_policy import allows_take_task, policy_role_for_staff_kind, ROLE_COMPANION
        from app.modules.users.models import RoleEnum

        request, service, slug = await self._load_open_request(request_id)
        if not allows_take_task(slug):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This service cannot be taken. Assign a Service Companion.",
            )
        if getattr(request, "executor_id", None):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This request already has an executor.",
            )
        care_repo = CareManagerRepository(self.repo.session)
        profile = await care_repo.get_by_user_id(actor.id)
        if not profile or (profile.status or "").upper() != "ACTIVE":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")
        role = policy_role_for_staff_kind(profile.staff_kind)
        is_staff = actor.role in (RoleEnum.ADMIN, RoleEnum.OPERATIONS)
        is_dispatcher = request.dispatcher_id and profile.id == request.dispatcher_id
        if not is_staff and not is_dispatcher:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the assigned Companion can take this job.",
            )
        if not is_staff and role != ROLE_COMPANION:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only a Companion can take this job.",
            )

        senior = await SeniorRepository(self.repo.session).get_by_id(request.senior_id)
        senior_name = _person_name(getattr(senior, "first_name", None), getattr(senior, "last_name", None))
        await self._create_jobs_for_assignees(request, service, slug, senior, senior_name, [profile])
        request = await self.repo.update_request(
            request,
            {"status": ServiceRequestStatus.ASSIGNED, "executor_id": profile.id},
        )
        if self.audit_repo:
            await self.audit_repo.record(
                entity_name="service_requests",
                entity_id=str(request.id),
                action="TAKE",
                changes=json.dumps({"executor_id": str(profile.id), "service_slug": slug}),
            )
            await self.repo.session.commit()
        return await self._to_read(request, service, senior_name=senior_name)

    async def assign_service_companion(self, request_id, care_manager_id, *, actor) -> ServiceRequestRead:
        from app.modules.care.repository import CareManagerRepository
        from app.modules.seniors.repository import SeniorRepository
        from app.modules.services.service_policy import (
            ROLE_SERVICE_COMPANION,
            allows_take_task,
            ensure_can_assign,
            needs_service_companion_dispatch,
            policy_role_for_staff_kind,
            sc_is_sole_finisher,
        )
        from app.modules.users.models import RoleEnum
        from app.modules.visits.models import Visit, VisitStatus
        from sqlalchemy import select

        request, service, slug = await self._load_open_request(request_id)
        if not needs_service_companion_dispatch(slug):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This service does not use Service Companion handoff.",
            )

        care_repo = CareManagerRepository(self.repo.session)
        actor_profile = await care_repo.get_by_user_id(actor.id) if actor else None
        is_staff = actor is not None and actor.role in (RoleEnum.ADMIN, RoleEnum.OPERATIONS)
        is_dispatcher = (
            actor_profile is not None
            and request.dispatcher_id
            and actor_profile.id == request.dispatcher_id
        )
        is_executor = (
            actor_profile is not None
            and request.executor_id
            and actor_profile.id == request.executor_id
        )
        existing_executor = getattr(request, "executor_id", None)
        if existing_executor:
            # After Take (or mistaken companion job), still allow handoff to SC before work finishes.
            if not (allows_take_task(slug) or sc_is_sole_finisher(slug)):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="This request already has an executor.",
                )
            if not is_staff and not is_executor and not is_dispatcher:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Only the assigned Companion or staff can hand this off.",
                )
        elif not is_staff and not is_dispatcher:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the assigned Companion or staff can hand this off.",
            )

        assignee = await care_repo.get_by_id(care_manager_id)
        if not assignee or (assignee.status or "").upper() != "ACTIVE":
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service Companion not found")
        role = policy_role_for_staff_kind(assignee.staff_kind)
        if role != ROLE_SERVICE_COMPANION:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Select a Service Companion.",
            )
        ensure_can_assign(
            slug,
            role,
            companion_service_slugs=getattr(assignee, "companion_service_slugs", None),
        )

        # Cancel companion's not-started visits for this senior + service before SC job.
        prior_owner = existing_executor or (actor_profile.id if actor_profile else None)
        if prior_owner and prior_owner != assignee.id:
            result = await self.repo.session.execute(
                select(Visit).where(
                    Visit.senior_id == request.senior_id,
                    Visit.care_manager_id == prior_owner,
                    Visit.service_slug == slug,
                    Visit.status == VisitStatus.SCHEDULED,
                )
            )
            for visit in result.scalars().all():
                visit.status = VisitStatus.CANCELLED
            await self.repo.session.flush()

        senior = await SeniorRepository(self.repo.session).get_by_id(request.senior_id)
        senior_name = _person_name(getattr(senior, "first_name", None), getattr(senior, "last_name", None))
        await self._create_jobs_for_assignees(request, service, slug, senior, senior_name, [assignee])
        request = await self.repo.update_request(
            request,
            {"status": ServiceRequestStatus.ASSIGNED, "executor_id": assignee.id},
        )
        if self.audit_repo:
            await self.audit_repo.record(
                entity_name="service_requests",
                entity_id=str(request.id),
                action="ASSIGN_SC",
                changes=json.dumps({"executor_id": str(assignee.id), "service_slug": slug}),
            )
            await self.repo.session.commit()
        return await self._to_read(request, service, senior_name=senior_name)

    async def find_open_request_for_visit(self, *, senior_id, service_slug: str | None):
        from sqlalchemy import select

        from app.modules.services.models import Service, ServiceRequest, ServiceRequestStatus

        if not service_slug:
            return None
        result = await self.repo.session.execute(
            select(ServiceRequest)
            .join(Service, ServiceRequest.service_id == Service.id)
            .where(
                ServiceRequest.senior_id == senior_id,
                Service.slug == service_slug,
                ServiceRequest.status == ServiceRequestStatus.ASSIGNED,
            )
            .order_by(ServiceRequest.created_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def assign_service_companion_for_visit(
        self, visit_id, care_manager_id, *, actor
    ) -> ServiceRequestRead:
        from app.modules.visits.models import VisitStatus
        from app.modules.visits.repository import VisitRepository

        row = await VisitRepository(self.repo.session).get_by_id(visit_id)
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Visit not found")
        visit = row[0]
        if visit.status != VisitStatus.SCHEDULED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only a scheduled task can be handed off to a Service Companion.",
            )
        request = await self.find_open_request_for_visit(
            senior_id=visit.senior_id,
            service_slug=getattr(visit, "service_slug", None),
        )
        if not request:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No open service request found for this task.",
            )
        return await self.assign_service_companion(
            request.id, care_manager_id, actor=actor
        )

    async def _maybe_auto_assign_standing(self, request, service) -> None:
        from app.modules.care.repository import CareManagerRepository
        from app.modules.seniors.repository import SeniorRepository
        from app.modules.services.service_policy import (
            ROLE_CARE_MANAGER,
            ROLE_COMPANION,
            can_assign,
            policy_role_for_staff_kind,
            should_auto_assign_standing,
        )

        slug = service.slug if service else None
        if not should_auto_assign_standing(slug):
            return
        senior = await SeniorRepository(self.repo.session).get_by_id(request.senior_id)
        if not senior:
            return
        care_repo = CareManagerRepository(self.repo.session)
        ids = []
        for attr, wanted in (
            ("care_manager_id", ROLE_CARE_MANAGER),
            ("companion_id", ROLE_COMPANION),
        ):
            standing_id = getattr(senior, attr, None)
            if not standing_id:
                continue
            associate = await care_repo.get_by_id(standing_id)
            if not associate or (associate.status or "").upper() != "ACTIVE":
                continue
            role = policy_role_for_staff_kind(associate.staff_kind)
            if role != wanted:
                continue
            if not can_assign(
                slug,
                role,
                companion_service_slugs=getattr(associate, "companion_service_slugs", None),
            ):
                continue
            ids.append(associate.id)
        if not ids:
            return
        await self.assign_request(request.id, ids, actor=None)

    async def _maybe_auto_dispatch_to_standing_companion(self, request, service) -> None:
        """SC-dispatch services: soft-assign the senior's standing Companion for handoff."""
        from app.modules.care.repository import CareManagerRepository
        from app.modules.seniors.repository import SeniorRepository
        from app.modules.services.service_policy import (
            ROLE_COMPANION,
            needs_service_companion_dispatch,
            policy_role_for_staff_kind,
        )

        slug = service.slug if service else None
        if not needs_service_companion_dispatch(slug):
            return
        if request.status in (ServiceRequestStatus.COMPLETED, ServiceRequestStatus.CANCELLED):
            return
        if getattr(request, "executor_id", None) or getattr(request, "dispatcher_id", None):
            return
        senior = await SeniorRepository(self.repo.session).get_by_id(request.senior_id)
        companion_id = getattr(senior, "companion_id", None) if senior else None
        if not companion_id:
            return
        care_repo = CareManagerRepository(self.repo.session)
        companion = await care_repo.get_by_id(companion_id)
        if not companion or (companion.status or "").upper() != "ACTIVE":
            return
        if policy_role_for_staff_kind(companion.staff_kind) != ROLE_COMPANION:
            return
        await self.assign_request(request.id, [companion.id], actor=None)

    async def _load_open_request(self, request_id):
        request = await self.repo.get_request_by_id(request_id)
        if not request:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service request not found")
        if request.status in (ServiceRequestStatus.COMPLETED, ServiceRequestStatus.CANCELLED):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This request is already closed.",
            )
        service = await self.repo.get_by_id(request.service_id)
        slug = service.slug if service else None
        return request, service, slug

    async def _create_jobs_for_assignees(self, request, service, slug, senior, senior_name, assignees) -> None:
        from datetime import datetime, timezone

        from app.modules.deliveries.models import DeliveryStatus
        from app.modules.deliveries.repository import DeliveryRepository
        from app.modules.services.service_policy import uses_delivery_job
        from app.modules.visits.models import VisitStatus
        from app.modules.visits.repository import VisitRepository

        delivery_repo = DeliveryRepository(self.repo.session)
        visit_repo = VisitRepository(self.repo.session)
        now = datetime.now(timezone.utc)
        for assignee in assignees:
            if uses_delivery_job(slug):
                await delivery_repo.create(
                    care_manager_id=assignee.id,
                    senior_id=request.senior_id,
                    service_request_id=request.id,
                    title=service.name if service else (slug or "Delivery"),
                    customer_name=senior_name,
                    location=_delivery_location(senior),
                    status=DeliveryStatus.PENDING,
                    scheduled_at=now,
                    service_slug=slug,
                )
            else:
                await visit_repo.create(
                    senior_id=request.senior_id,
                    care_manager_id=assignee.id,
                    status=VisitStatus.SCHEDULED,
                    scheduled_at=now,
                    notes=request.notes,
                    service_slug=slug,
                )

    def _read_from_row(self, request, service_name, service_slug, first_name, last_name) -> ServiceRequestRead:
        from app.modules.services.service_policy import dispatch_mode_for

        mode = dispatch_mode_for(service_slug)
        awaiting = bool(
            request.status == ServiceRequestStatus.ASSIGNED
            and getattr(request, "dispatcher_id", None)
            and not getattr(request, "executor_id", None)
            and mode != "none"
        )
        return ServiceRequestRead(
            id=request.id,
            senior_id=request.senior_id,
            service_id=request.service_id,
            service_name=service_name or "",
            service_slug=service_slug,
            senior_name=_person_name(first_name, last_name),
            status=request.status,
            notes=request.notes,
            created_at=getattr(request, "created_at", None),
            proof_photo=getattr(request, "proof_photo", None),
            list_photo=getattr(request, "list_photo", None),
            dispatcher_id=getattr(request, "dispatcher_id", None),
            executor_id=getattr(request, "executor_id", None),
            dispatch_mode=mode,
            awaiting_dispatch=awaiting,
        )

    async def _to_read(self, request, service, senior_name: str | None = None) -> ServiceRequestRead:
        if senior_name is None and request.senior_id:
            from app.modules.seniors.repository import SeniorRepository

            senior = await SeniorRepository(self.repo.session).get_by_id(request.senior_id)
            senior_name = _person_name(getattr(senior, "first_name", None), getattr(senior, "last_name", None))
        first = None
        last = None
        if senior_name:
            parts = senior_name.split(" ", 1)
            first = parts[0]
            last = parts[1] if len(parts) > 1 else None
        return self._read_from_row(
            request,
            service.name if service else "",
            service.slug if service else None,
            first,
            last,
        )
