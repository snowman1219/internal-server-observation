from datetime import datetime

from pydantic import BaseModel


class ServerSummary(BaseModel):
    name: str
    host: str
    is_online: bool
    last_updated_at: datetime
    error: str | None = None
    active_users: list[str] | None = None
    cpu_used_percent: float | None = None
    memory_used_percent: float | None = None
    disk_max_used_percent: float | None = None
    gpu_max_utilization_percent: int | None = None


class ServerListResponse(BaseModel):
    servers: list[ServerSummary]


class HealthResponse(BaseModel):
    status: str
    uptime_seconds: float
    polling_interval_seconds: int
    server_count: int
