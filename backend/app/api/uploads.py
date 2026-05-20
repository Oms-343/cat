import uuid
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse

from app.config import get_settings
from app.deps import CurrentUser

router = APIRouter(prefix="/api/uploads", tags=["uploads"])

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}


@router.post("")
async def upload_file(
    _user: CurrentUser,
    file: UploadFile = File(...),
) -> dict[str, str]:
    settings = get_settings()
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="only JPEG, PNG, WebP, and GIF images are allowed",
        )

    data = await file.read()
    if len(data) > settings.max_upload_bytes:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="file too large")

    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)

    ext = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
        "image/gif": ".gif",
    }.get(file.content_type, ".bin")
    name = f"{uuid.uuid4().hex}{ext}"
    path = upload_dir / name
    path.write_bytes(data)

    return {"url": f"/api/uploads/{name}", "filename": name}


@router.get("/{filename}")
def get_upload(filename: str) -> FileResponse:
    if ".." in filename or "/" in filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="invalid filename")
    settings = get_settings()
    path = Path(settings.upload_dir) / filename
    if not path.is_file():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="file not found")
    return FileResponse(path)
