from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from .models import Service, ServiceRequest
from .schemas import ServiceCreate, ServiceRequestCreate

class ServiceRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_all_services(self):
        result = await self.session.execute(select(Service))
        return result.scalars().all()

    async def get_by_id(self, service_id):
        result = await self.session.execute(select(Service).where(Service.id == service_id))
        return result.scalar_one_or_none()

    async def get_by_slug(self, slug: str):
        result = await self.session.execute(select(Service).where(Service.slug == slug))
        return result.scalar_one_or_none()

    async def create_service(self, item: ServiceCreate) -> Service:
        db_item = Service(**item.model_dump())
        self.session.add(db_item)
        await self.session.commit()
        await self.session.refresh(db_item)
        return db_item

    async def list_requests(
        self,
        *,
        senior_id=None,
        status=None,
        service_id=None,
        service_slug=None,
        service_city=None,
        dispatcher_id=None,
        awaiting_dispatch: bool | None = None,
        limit: int = 50,
        offset: int = 0,
    ):
        from sqlalchemy import func

        from app.modules.cities.catalog import apply_city_fk

        from app.modules.seniors.models import Senior

        stmt = (
            select(ServiceRequest, Service.name, Service.slug, Senior.first_name, Senior.last_name)
            .join(Service, ServiceRequest.service_id == Service.id)
            .outerjoin(Senior, ServiceRequest.senior_id == Senior.id)
        )
        count_stmt = select(func.count()).select_from(ServiceRequest)
        stmt, count_stmt = apply_city_fk(stmt, count_stmt, ServiceRequest.senior_id, service_city)

        if senior_id is not None:
            stmt = stmt.where(ServiceRequest.senior_id == senior_id)
            count_stmt = count_stmt.where(ServiceRequest.senior_id == senior_id)
        if status is not None:
            stmt = stmt.where(ServiceRequest.status == status)
            count_stmt = count_stmt.where(ServiceRequest.status == status)
        if service_id is not None:
            stmt = stmt.where(ServiceRequest.service_id == service_id)
            count_stmt = count_stmt.where(ServiceRequest.service_id == service_id)
        if service_slug:
            stmt = stmt.where(Service.slug == service_slug)
            count_stmt = count_stmt.join(Service, ServiceRequest.service_id == Service.id).where(
                Service.slug == service_slug
            )
        if dispatcher_id is not None:
            stmt = stmt.where(ServiceRequest.dispatcher_id == dispatcher_id)
            count_stmt = count_stmt.where(ServiceRequest.dispatcher_id == dispatcher_id)
        if awaiting_dispatch is True:
            stmt = stmt.where(
                ServiceRequest.dispatcher_id.is_not(None),
                ServiceRequest.executor_id.is_(None),
            )
            count_stmt = count_stmt.where(
                ServiceRequest.dispatcher_id.is_not(None),
                ServiceRequest.executor_id.is_(None),
            )

        total = (await self.session.execute(count_stmt)).scalar_one()
        result = await self.session.execute(
            stmt.order_by(ServiceRequest.created_at.desc()).offset(offset).limit(limit)
        )
        return result.all(), int(total)

    async def unassigned_counts_by_slug(self, *, service_city: str | None = None) -> dict[str, int]:
        from sqlalchemy import func, or_, and_

        from app.modules.cities.catalog import apply_city_fk
        from app.modules.services.models import ServiceRequestStatus
        from app.modules.services.service_policy import DESK_ONLY_SLUGS

        needs_work = or_(
            ServiceRequest.status.in_((ServiceRequestStatus.REQUESTED, ServiceRequestStatus.CONFIRMED)),
            and_(
                ServiceRequest.status == ServiceRequestStatus.ASSIGNED,
                ServiceRequest.dispatcher_id.is_not(None),
                ServiceRequest.executor_id.is_(None),
            ),
        )
        stmt = (
            select(Service.slug, func.count())
            .select_from(ServiceRequest)
            .join(Service, ServiceRequest.service_id == Service.id)
            .where(needs_work)
            .where(Service.slug.is_not(None))
            .group_by(Service.slug)
        )
        count_stmt = select(func.count()).select_from(ServiceRequest)
        stmt, _ = apply_city_fk(stmt, count_stmt, ServiceRequest.senior_id, service_city)
        rows = (await self.session.execute(stmt)).all()
        counts: dict[str, int] = {}
        for slug, total in rows:
            if not slug or slug in DESK_ONLY_SLUGS:
                continue
            counts[str(slug)] = int(total)
        return counts

    async def create_request(self, req: ServiceRequestCreate) -> ServiceRequest:
        db_req = ServiceRequest(**req.model_dump())
        self.session.add(db_req)
        await self.session.commit()
        await self.session.refresh(db_req)
        return db_req

    async def get_request_by_id(self, request_id):
        result = await self.session.execute(select(ServiceRequest).where(ServiceRequest.id == request_id))
        return result.scalar_one_or_none()

    async def update_service(self, row: Service, data: dict) -> Service:
        for field, value in data.items():
            setattr(row, field, value)
        await self.session.commit()
        await self.session.refresh(row)
        return row

    async def update_request(self, row: ServiceRequest, data: dict) -> ServiceRequest:
        for field, value in data.items():
            setattr(row, field, value)
        await self.session.commit()
        await self.session.refresh(row)
        return row
