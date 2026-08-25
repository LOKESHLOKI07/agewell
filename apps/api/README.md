# AgeWell Backend API

Phase 3 - Modular Monolith Backend Foundation for AgeWell platform.

## Technology Stack
- Python 3.12+
- FastAPI
- PostgreSQL
- SQLAlchemy 2.x
- Alembic
- Pydantic v2
- Redis
- pytest

## Local Development

### 1. Installation
Create a virtual environment and install dependencies:
```bash
python -m venv venv
source venv/bin/activate  # On Windows use `venv\Scripts\activate`
pip install -r requirements.txt
```

### 2. Environment Variables
Copy the `.env.example` file:
```bash
cp .env.example .env
```
Ensure you have a PostgreSQL database running locally and configure `DATABASE_URL` appropriately.

### 3. Database Startup (Docker Compose)
(Optional) Start the dependencies:
```bash
docker-compose up -d
```

### 4. Migration & Seed Data
Initialize the database using Alembic:
```bash
alembic upgrade head
python scripts/seed.py
```

### 5. API Startup
```bash
uvicorn app.main:app --reload
```

### 6. Tests & Linting
Run Pytest to verify everything works:
```bash
pytest
```

## Structure
- `/app/api/v1/`: API endpoints separated by module.
- `/app/db/`: SQLAlchemy setup and models.
- `/app/modules/`: Domain specific components (models, schemas, routers, services).
- `/tests/`: Automated tests.

## Phase Boundary
DO NOT CONNECT THIS BACKEND TO THE REACT NATIVE APP IN PHASE 3.
