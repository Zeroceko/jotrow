import io
import os
import uuid
from datetime import timedelta
from typing import Optional

from minio import Minio
from minio.error import S3Error
from PIL import Image
import pillow_heif

from app.core.config import settings

# Register HEIF/HEIC opener with Pillow
pillow_heif.register_heif_opener()


def _convert_heic_to_jpeg(file_data) -> tuple:
    """Convert HEIC/HEIF file data to JPEG. Returns (bytes_io, new_filename_suffix, content_type)."""
    img = Image.open(file_data)
    if img.mode in ("RGBA", "P"):
        img = img.convert("RGB")
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=90)
    buf.seek(0)
    return buf, ".jpg", "image/jpeg"


def _is_heic(filename: str, content_type: Optional[str]) -> bool:
    """Check if a file is HEIC/HEIF based on extension or content type."""
    ext = os.path.splitext(filename)[1].lower() if filename else ""
    heic_extensions = {".heic", ".heif"}
    heic_types = {"image/heic", "image/heif", "image/heic-sequence", "image/heif-sequence"}
    return ext in heic_extensions or bool(content_type and content_type.lower() in heic_types)

is_local = settings.MINIO_ENDPOINT.startswith("localhost") or settings.MINIO_ENDPOINT.startswith("127.0.0.1") or settings.MINIO_ENDPOINT.startswith("minio")
client = Minio(
    settings.MINIO_ENDPOINT,
    access_key=settings.MINIO_ACCESS_KEY,
    secret_key=settings.MINIO_SECRET_KEY,
    secure=not is_local,
)

def ensure_bucket_exists():
    found = client.bucket_exists(settings.MINIO_BUCKET_NAME)
    if not found:
        client.make_bucket(settings.MINIO_BUCKET_NAME)
        # Set bucket policy to public read for simplistic access, or keep it private and use presigned URLs.
        # We will use presigned URLs since these notes shouldn't be fully public randomly, but shared via code.
    return True

def upload_file_to_minio(file_data, file_name: str, content_type: str) -> str:
    ensure_bucket_exists()

    # Convert HEIC/HEIF to JPEG for browser compatibility
    if _is_heic(file_name, content_type):
        file_data, suffix, content_type = _convert_heic_to_jpeg(file_data)
        base_name = os.path.splitext(file_name)[0]
        file_name = base_name + suffix

    unique_file_name = f"{uuid.uuid4()}_{file_name}"

    client.put_object(
        settings.MINIO_BUCKET_NAME,
        unique_file_name,
        file_data,
        length=-1,
        part_size=10*1024*1024,
        content_type=content_type,
    )
    return unique_file_name

def get_presigned_url(object_name: str, expires_minutes: int = 60) -> str:
    try:
         url = client.presigned_get_object(
            settings.MINIO_BUCKET_NAME,
            object_name,
            expires=timedelta(minutes=expires_minutes),
        )
         return url
    except Exception as err:
        print(f"Error getting presigned url: {err}")
        return ""

def delete_file_from_minio(object_name: str) -> bool:
    try:
        client.remove_object(settings.MINIO_BUCKET_NAME, object_name)
        return True
    except Exception as err:
        print(f"Error deleting object from MinIO: {err}")
        return False
