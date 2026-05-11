from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, users, loans, prediction, admin

app = FastAPI(title="Loan Approval API", version="1.0.0")

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
app.include_router(prediction.router)
app.include_router(admin.router)


@app.get("/health")
def health():
    return {"status": "ok"}
