import os

def create_domain(module, schema_code, repo_code, service_code, router_code):
    base_dir = f"app/modules/{module}"
    with open(f"{base_dir}/schemas.py", "w") as f: f.write(schema_code)
    with open(f"{base_dir}/repository.py", "w") as f: f.write(repo_code)
    with open(f"{base_dir}/service.py", "w") as f: f.write(service_code)
    with open(f"{base_dir}/router.py", "w") as f: f.write(router_code)

# USERS
users_schema = """from pydantic import BaseModel, UUID4, EmailStr
from typing import Optional
from datetime import datetime
from .models import RoleEnum

class UserBase(BaseModel):
    email: str
    phone: str
    role: RoleEnum

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: UUID4
    created_at: datetime
    class Config:
        from_attributes = True
"""
users_repo = """from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from .models import User
from .schemas import UserCreate

class UserRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, user_id):
        stmt = select(User).where(User.id == user_id)
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def create(self, user: UserCreate) -> User:
        db_user = User(email=user.email, phone=user.phone, role=user.role, hashed_password=user.password)
        self.session.add(db_user)
        await self.session.commit()
        await self.session.refresh(db_user)
        return db_user
"""
users_service = """from .repository import UserRepository
from .schemas import UserCreate
from app.core.security import get_password_hash

class UserService:
    def __init__(self, repo: UserRepository):
        self.repo = repo

    async def create_user(self, user_in: UserCreate):
        user_in.password = get_password_hash(user_in.password)
        return await self.repo.create(user_in)

    async def get_user(self, user_id):
        return await self.repo.get_by_id(user_id)
"""
users_router = """from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_db
from .schemas import UserResponse, UserCreate
from .repository import UserRepository
from .service import UserService

router = APIRouter()

def get_user_service(db: AsyncSession = Depends(get_db)):
    return UserService(UserRepository(db))

@router.post("/", response_model=UserResponse)
async def create_user(user_in: UserCreate, service: UserService = Depends(get_user_service)):
    return await service.create_user(user_in)

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: str, service: UserService = Depends(get_user_service)):
    user = await service.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
"""
create_domain("users", users_schema, users_repo, users_service, users_router)

# SENIORS
seniors_schema = """from pydantic import BaseModel, UUID4
from typing import Optional
from datetime import datetime, date

class SeniorBase(BaseModel):
    first_name: str
    last_name: str
    date_of_birth: date
    address: str
    emergency_contact: str

class SeniorCreate(SeniorBase):
    user_id: UUID4

class SeniorResponse(SeniorBase):
    id: UUID4
    user_id: UUID4
    class Config:
        from_attributes = True
"""
seniors_repo = """from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from .models import Senior
from .schemas import SeniorCreate

class SeniorRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, senior_id):
        stmt = select(Senior).where(Senior.id == senior_id)
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def create(self, senior: SeniorCreate) -> Senior:
        db_senior = Senior(**senior.dict())
        self.session.add(db_senior)
        await self.session.commit()
        await self.session.refresh(db_senior)
        return db_senior
"""
seniors_service = """from .repository import SeniorRepository
from .schemas import SeniorCreate

class SeniorService:
    def __init__(self, repo: SeniorRepository):
        self.repo = repo

    async def create_senior(self, senior_in: SeniorCreate):
        return await self.repo.create(senior_in)

    async def get_senior(self, senior_id):
        return await self.repo.get_by_id(senior_id)
"""
seniors_router = """from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_db
from .schemas import SeniorResponse, SeniorCreate
from .repository import SeniorRepository
from .service import SeniorService

router = APIRouter()

def get_senior_service(db: AsyncSession = Depends(get_db)):
    return SeniorService(SeniorRepository(db))

@router.post("/", response_model=SeniorResponse)
async def create_senior(senior_in: SeniorCreate, service: SeniorService = Depends(get_senior_service)):
    return await service.create_senior(senior_in)

@router.get("/{senior_id}", response_model=SeniorResponse)
async def get_senior(senior_id: str, service: SeniorService = Depends(get_senior_service)):
    senior = await service.get_senior(senior_id)
    if not senior:
        raise HTTPException(status_code=404, detail="Senior not found")
    return senior
"""
create_domain("seniors", seniors_schema, seniors_repo, seniors_service, seniors_router)

# SERVICES
services_schema = """from pydantic import BaseModel, UUID4
from typing import Optional
from .models import ServiceCategory, ServiceRequestStatus

class ServiceBase(BaseModel):
    name: str
    category: ServiceCategory
    description: str

class ServiceCreate(ServiceBase):
    pass

class ServiceResponse(ServiceBase):
    id: UUID4
    class Config:
        from_attributes = True

class ServiceRequestCreate(BaseModel):
    senior_id: UUID4
    service_id: UUID4

class ServiceRequestResponse(ServiceRequestCreate):
    id: UUID4
    status: ServiceRequestStatus
    class Config:
        from_attributes = True
"""
services_repo = """from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from .models import Service, ServiceRequest
from .schemas import ServiceCreate, ServiceRequestCreate

class ServiceRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_all_services(self):
        result = await self.session.execute(select(Service))
        return result.scalars().all()

    async def create_service(self, item: ServiceCreate) -> Service:
        db_item = Service(**item.dict())
        self.session.add(db_item)
        await self.session.commit()
        await self.session.refresh(db_item)
        return db_item

    async def create_request(self, req: ServiceRequestCreate) -> ServiceRequest:
        db_req = ServiceRequest(**req.dict())
        self.session.add(db_req)
        await self.session.commit()
        await self.session.refresh(db_req)
        return db_req
"""
services_service = """from .repository import ServiceRepository
from .schemas import ServiceCreate, ServiceRequestCreate

class ServiceManager:
    def __init__(self, repo: ServiceRepository):
        self.repo = repo

    async def create_service(self, item: ServiceCreate):
        return await self.repo.create_service(item)

    async def get_services(self):
        return await self.repo.get_all_services()

    async def request_service(self, req: ServiceRequestCreate):
        return await self.repo.create_request(req)
"""
services_router = """from fastapi import APIRouter, Depends
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_db
from .schemas import ServiceResponse, ServiceCreate, ServiceRequestResponse, ServiceRequestCreate
from .repository import ServiceRepository
from .service import ServiceManager

router = APIRouter()

def get_service_manager(db: AsyncSession = Depends(get_db)):
    return ServiceManager(ServiceRepository(db))

@router.get("/", response_model=List[ServiceResponse])
async def list_services(manager: ServiceManager = Depends(get_service_manager)):
    return await manager.get_services()

@router.post("/", response_model=ServiceResponse)
async def create_service(item: ServiceCreate, manager: ServiceManager = Depends(get_service_manager)):
    return await manager.create_service(item)

@router.post("/requests", response_model=ServiceRequestResponse)
async def create_request(req: ServiceRequestCreate, manager: ServiceManager = Depends(get_service_manager)):
    return await manager.request_service(req)
"""
create_domain("services", services_schema, services_repo, services_service, services_router)

print("Domains generated")
