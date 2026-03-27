from pathlib import Path

import yaml

from server.main import app


def export() -> None:
    openapi_schema = app.openapi()
    output_path = Path(__file__).resolve().parent.parent.parent / "docs" / "openapi.yaml"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w") as f:
        yaml.dump(openapi_schema, f, default_flow_style=False, allow_unicode=True)


if __name__ == "__main__":
    export()
