from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import health, home, me, seats, session

app = FastAPI(title="Wedding API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(session.router)
app.include_router(me.router)
app.include_router(home.router)
app.include_router(seats.router)
