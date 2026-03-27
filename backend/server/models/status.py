from datetime import datetime

from pydantic import BaseModel


class CpuMemoryOverview(BaseModel):
    cpu_count: int
    load_average_1m: float
    load_average_5m: float
    load_average_15m: float
    memory_total: str
    memory_used: str
    memory_free: str
    memory_available: str
    memory_used_percent: float
    swap_total: str
    swap_used: str
    swap_free: str
    swap_used_percent: float


class UserProcessSummary(BaseModel):
    user: str
    cpu_percent: float
    memory_percent: float


class TopProcess(BaseModel):
    user: str
    pid: int
    cpu_percent: float
    memory_percent: float
    command: str


class ProcessSummary(BaseModel):
    per_user: list[UserProcessSummary]
    top_processes: list[TopProcess]


class FilesystemUsage(BaseModel):
    source: str
    fstype: str
    size: str
    used: str
    available: str
    used_percent: float
    mount_point: str


class UserHomeUsage(BaseModel):
    user: str
    size: str


class DiskUsage(BaseModel):
    filesystems: list[FilesystemUsage]
    user_home: list[UserHomeUsage]


class TmuxUserSummary(BaseModel):
    user: str
    session_count: int
    window_count: int


class GpuInfo(BaseModel):
    index: int
    name: str
    utilization_percent: int
    memory_used: str
    memory_total: str
    memory_used_percent: float
    temperature_celsius: int


class GpuProcess(BaseModel):
    gpu_index: int
    gpu_name: str
    pid: int
    user: str
    used_memory: str


class GpuStatus(BaseModel):
    gpus: list[GpuInfo]
    gpu_processes: list[GpuProcess]


class ServerStatus(BaseModel):
    server_name: str
    host: str
    is_online: bool
    last_updated_at: datetime
    error: str | None = None
    cpu_memory_overview: CpuMemoryOverview | None = None
    process_summary: ProcessSummary | None = None
    disk_usage: DiskUsage | None = None
    tmux_sessions: list[TmuxUserSummary] | None = None
    gpu_status: GpuStatus | None = None
