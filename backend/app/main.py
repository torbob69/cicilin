from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import check_db_connection
from app.jobs.scheduler import start_scheduler, stop_scheduler
from app.routers import auth, admin, users, loans, leaderboard, quests


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    ok = check_db_connection()
    if ok:
        print("[DB] Connected to 'cicilin' successfully.")
    else:
        print("[DB] WARNING: Could not connect to database.")
    start_scheduler()

    yield

    # Shutdown
    stop_scheduler()


app = FastAPI(
    title="Cicilin API",
    description="Loan approval app with ML scoring",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth.router)
app.include_router(users.router)
app.include_router(loans.router)
app.include_router(admin.router)
app.include_router(leaderboard.router)
app.include_router(quests.router)


@app.get("/")
def root():
    return {"message": "Cicilin API is running", "env": settings.APP_ENV}


@app.get("/health")
def health():
    db_ok = check_db_connection()
    return {
        "status": "ok" if db_ok else "degraded",
        "database": "connected" if db_ok else "unreachable",
    }
