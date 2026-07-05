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
app.include_router(gallery.router)
app.include_router(travel.router)
app.include_router(admin.router)
