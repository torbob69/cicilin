import cloudinary
import cloudinary.uploader
from fastapi import HTTPException, UploadFile, status

from app.core.config import settings

_ALLOWED_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}


def _configure() -> None:
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True,
    )


def upload_image(file: UploadFile, folder: str, public_id: str | None = None) -> str:
    """Upload an image to Cloudinary and return the secure URL."""
    if settings.is_development and not settings.CLOUDINARY_API_KEY:
        name = public_id or (file.filename or "placeholder")
        return f"https://res.cloudinary.com/demo/image/upload/{folder}/{name}.jpg"

    if file.content_type not in _ALLOWED_TYPES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Only JPEG, PNG, and WebP images are accepted",
        )

    _configure()
    try:
        result = cloudinary.uploader.upload(
            file.file,
            folder=folder,
            public_id=public_id,
            overwrite=True,
            resource_type="image",
        )
        return result["secure_url"]
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Image upload failed: {exc}",
        )
