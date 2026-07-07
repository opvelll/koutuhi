from pathlib import Path
import sys


def app_root() -> Path:
    if getattr(sys, 'frozen', False):
        return Path(sys.executable).resolve().parent
    return Path(__file__).resolve().parent.parent


def resolve_app_path(path: str | Path) -> Path:
    resolved = Path(path).expanduser()
    if resolved.is_absolute():
        return resolved
    return app_root() / resolved


def resource_path(*parts: str) -> Path:
    return app_root().joinpath(*parts)
