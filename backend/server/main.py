import asyncio
import contextlib
import logging
import os
import time
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from datetime import UTC, datetime
from typing import TYPE_CHECKING

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from server.config import load_config
from server.models.status import ServerStatus
from server.routers import health, servers
from server.scheduler import poll_loop
from server.store import StatusStore

if TYPE_CHECKING:
    from collections.abc import AsyncIterator

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    # Startup
    config = load_config()
    store = StatusStore()

    # Initialize all servers as offline
    for srv in config.servers:
        await store.update(
            srv.name,
            ServerStatus(
                server_name=srv.name,
                host=srv.host,
                is_online=False,
                last_updated_at=datetime.now(UTC),
            ),
        )

    app.state.config = config
    app.state.store = store
    app.state.start_time = time.time()

    # Start background polling
    task = asyncio.create_task(poll_loop(config, store))
    logger.info("Started polling %d servers every %ds", len(config.servers), config.poll_interval_seconds)

    yield

    # Shutdown
    task.cancel()
    with contextlib.suppress(asyncio.CancelledError):
        await task
    logger.info("Scheduler stopped")


app = FastAPI(title="Internal Server Observation", lifespan=lifespan)

# CORS for development
if os.getenv("ENVIRONMENT") == "development":
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173"],
        allow_methods=["GET"],
        allow_headers=["*"],
    )

# Mount routers
app.include_router(servers.router, prefix="/api")
app.include_router(health.router, prefix="/api")
