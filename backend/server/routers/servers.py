from fastapi import APIRouter, HTTPException, Request

from server.models.responses import ServerListResponse
from server.models.status import ServerStatus

router = APIRouter()


@router.get(
    "/servers",
    response_model=ServerListResponse,
    summary="List all servers",
    tags=["servers"],
)
async def list_servers(request: Request) -> ServerListResponse:
    store = request.app.state.store
    summaries = await store.get_all_summaries()
    return ServerListResponse(servers=summaries)


@router.get(
    "/servers/{server_name}/status",
    response_model=ServerStatus,
    summary="Get server status",
    tags=["servers"],
    responses={404: {"description": "Server not found"}},
)
async def get_server_status(server_name: str, request: Request) -> ServerStatus:
    store = request.app.state.store
    status = await store.get(server_name)
    if status is None:
        raise HTTPException(status_code=404, detail=f"Server '{server_name}' not found")
    return status
