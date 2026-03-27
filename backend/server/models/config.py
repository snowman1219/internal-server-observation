from pydantic import BaseModel


class ServerConfig(BaseModel):
    name: str
    host: str
    ssh_user: str
    ssh_port: int = 22
    ssh_key_path: str | None = None


class AppConfig(BaseModel):
    poll_interval_seconds: int = 30
    ssh_timeout_seconds: int = 5
    ssh_key_path: str = "~/.ssh/id_rsa"
    servers: list[ServerConfig]
