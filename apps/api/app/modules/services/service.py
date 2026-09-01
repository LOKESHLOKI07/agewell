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
        return await self.repo.create_request(req)

    async def list_requests(self, **kwargs):
        from app.api.schemas import ListPage

        rows, total = await self.repo.list_requests(**kwargs)
        items = [
            ServiceRequestRead(
                id=request.id,
                senior_id=request.senior_id,
                service_id=request.service_id,
                service_name=service_name,
                service_slug=service_slug,
                status=request.status,
                notes=request.notes,
            )
            for request, service_name, service_slug in rows
        ]
        return ListPage(
            items=items,
            total=total,
            limit=kwargs.get("limit", 50),
            offset=kwargs.get("offset", 0),
        )

    async def update_request_status(self, request_id, new_status: ServiceRequestStatus) -> ServiceRequestRead:
        request = await self.repo.get_request_by_id(request_id)
        if not request:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service request not found")
        request = await self.repo.update_request(request, {"status": new_status})
        service = await self.repo.get_by_id(request.service_id)
        if self.audit_repo:
            await self.audit_repo.record(
                entity_name="service_requests",
                entity_id=str(request.id),
                action="UPDATE",
                changes=json.dumps({"status": new_status.value}),
            )
            await self.repo.session.commit()
        return ServiceRequestRead(
            id=request.id,
            senior_id=request.senior_id,
            service_id=request.service_id,
            service_name=service.name if service else "",
            service_slug=service.slug if service else None,
            status=request.status,
            notes=request.notes,
        )
