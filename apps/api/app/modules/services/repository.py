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
        limit: int = 50,
        offset: int = 0,
    ):
        from sqlalchemy import func

        stmt = (
            select(ServiceRequest, Service.name)
            .join(Service, ServiceRequest.service_id == Service.id)
        )
        count_stmt = select(func.count()).select_from(ServiceRequest)

        if senior_id is not None:
            stmt = stmt.where(ServiceRequest.senior_id == senior_id)
            count_stmt = count_stmt.where(ServiceRequest.senior_id == senior_id)
        if status is not None:
            stmt = stmt.where(ServiceRequest.status == status)
            count_stmt = count_stmt.where(ServiceRequest.status == status)
        if service_id is not None:
            stmt = stmt.where(ServiceRequest.service_id == service_id)
            count_stmt = count_stmt.where(ServiceRequest.service_id == service_id)

        total = (await self.session.execute(count_stmt)).scalar_one()
        result = await self.session.execute(stmt.offset(offset).limit(limit))
        return result.all(), int(total)

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
