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
secure_conn = settings.MINIO_SECURE if settings.MINIO_SECURE is not None else not is_local

client = Minio(
    settings.MINIO_ENDPOINT,
    access_key=settings.MINIO_ACCESS_KEY,
    secret_key=settings.MINIO_SECRET_KEY,
    secure=secure_conn,
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

    # Always process the image through Pillow for compression and format standardization
    try:
        # If it's HEIC, the pillow_heif opener handles it automatically when Image.open is called
        img = Image.open(file_data)
        
        # Convert to RGB if needed
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")
            
        # Resize if dimensions exceed 1200px (maintain aspect ratio)
        max_size = (1200, 1200)
        img.thumbnail(max_size, Image.Resampling.LANCZOS)
        
        # Save to buffer with compression
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=70)
        buf.seek(0)
        
        # Override file details for the compressed chunk
        file_data = buf
        content_type = "image/jpeg"
        base_name = os.path.splitext(file_name)[0]
        file_name = base_name + ".jpg"
        file_length = buf.getbuffer().nbytes
    except Exception as e:
        print(f"Error compressing image {file_name}: {e}")
        # If Pillow fails (not an image, etc.), fallback to calculating read size
        file_data.seek(0, os.SEEK_END)
        file_length = file_data.tell()
        file_data.seek(0)


    unique_file_name = f"{uuid.uuid4()}_{file_name}"

    client.put_object(
        settings.MINIO_BUCKET_NAME,
        unique_file_name,
        file_data,
        length=file_length,
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
