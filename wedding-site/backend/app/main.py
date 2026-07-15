import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import admin, gallery, health, home, me, seats, session, travel
from app.services import storage


@asynccontextmanager
async def lifespan(app: FastAPI):
    storage.ensure_bucket()
    yield


app = FastAPI(title="Wedding API", version="0.1.0", lifespan=lifespan)

_cors_origins = ["http://localhost:3000"]
if _site_url := os.getenv("SITE_URL"):
    _cors_origins.append(_site_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(session.router)
app.include_router(me.router)
app.include_router(home.router)
app.include_router(seats.router)
app.include_router(gallery.router)
app.include_router(travel.router)
app.include_router(admin.router)
