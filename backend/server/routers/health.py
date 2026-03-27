import time

from fastapi import APIRouter, Request

from server.models.responses import HealthResponse

router = APIRouter()


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Health check",
    tags=["health"],
)
async def health_check(request: Request) -> HealthResponse:
    config = request.app.state.config
    start_time: float = request.app.state.start_time
    return HealthResponse(
        status="ok",
        uptime_seconds=round(time.time() - start_time, 1),
        polling_interval_seconds=config.poll_interval_seconds,
        server_count=len(config.servers),
    )
