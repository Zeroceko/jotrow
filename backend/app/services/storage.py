import io
import os
import uuid
from datetime import timedelta
from typing import Optional

import boto3
from botocore.config import Config as BotoConfig
from botocore.exceptions import ClientError
from PIL import Image
import pillow_heif

from app.core.config import settings

# Register HEIF/HEIC opener with Pillow
pillow_heif.register_heif_opener()

# ── S3 Client Setup ──────────────────────────────────────────────────────────

_endpoint = settings.MINIO_ENDPOINT  # e.g., "xxx.supabase.co/storage/v1/s3"

# Build the full endpoint URL
if _endpoint.startswith("http://") or _endpoint.startswith("https://"):
    _endpoint_url = _endpoint
else:
    is_local = _endpoint.startswith("localhost") or _endpoint.startswith("127.0.0.1") or _endpoint.startswith("minio")
    scheme = "http" if is_local else "https"
    _endpoint_url = f"{scheme}://{_endpoint}"

# Override if MINIO_SECURE is explicitly set
if settings.MINIO_SECURE is not None:
    if settings.MINIO_SECURE:
        _endpoint_url = _endpoint_url.replace("http://", "https://")
    else:
        _endpoint_url = _endpoint_url.replace("https://", "http://")


s3_client = boto3.client(
    "s3",
    endpoint_url=_endpoint_url,
    aws_access_key_id=settings.MINIO_ACCESS_KEY,
    aws_secret_access_key=settings.MINIO_SECRET_KEY,
    region_name="auto",
    config=BotoConfig(
        signature_version="s3v4",
        s3={"addressing_style": "path"},
    ),
)

# Expose for debug endpoint
secure_conn = _endpoint_url.startswith("https")


def ensure_bucket_exists():
    try:
        s3_client.head_bucket(Bucket=settings.MINIO_BUCKET_NAME)
    except ClientError:
        try:
            s3_client.create_bucket(Bucket=settings.MINIO_BUCKET_NAME)
        except ClientError as e:
            print(f"Could not create bucket {settings.MINIO_BUCKET_NAME}: {e}")
    return True


def upload_file_to_minio(file_data, file_name: str, content_type: str) -> str:
    ensure_bucket_exists()

    # Process the image through Pillow for compression and format standardization
    try:
        img = Image.open(file_data)

        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")

        # Resize if dimensions exceed 1200px (maintain aspect ratio)
        max_size = (1200, 1200)
        img.thumbnail(max_size, Image.Resampling.LANCZOS)

        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=70)
        buf.seek(0)

        file_data = buf
        content_type = "image/jpeg"
        base_name = os.path.splitext(file_name)[0]
        file_name = base_name + ".jpg"
    except Exception as e:
        print(f"Error compressing image {file_name}: {e}")
        # Not an image or processing failed, upload as-is
        if hasattr(file_data, 'seek'):
            file_data.seek(0)

    unique_file_name = f"{uuid.uuid4()}_{file_name}"

    s3_client.put_object(
        Bucket=settings.MINIO_BUCKET_NAME,
        Key=unique_file_name,
        Body=file_data.read() if hasattr(file_data, 'read') else file_data,
        ContentType=content_type,
    )
    return unique_file_name


def get_presigned_url(object_name: str, expires_minutes: int = 60) -> str:
    try:
        url = s3_client.generate_presigned_url(
            "get_object",
            Params={
                "Bucket": settings.MINIO_BUCKET_NAME,
                "Key": object_name,
            },
            ExpiresIn=expires_minutes * 60,
        )
        return url
    except Exception as err:
        print(f"Error getting presigned url: {err}")
        return ""


def delete_file_from_minio(object_name: str) -> bool:
    try:
        s3_client.delete_object(
            Bucket=settings.MINIO_BUCKET_NAME,
            Key=object_name,
        )
        return True
    except Exception as err:
        print(f"Error deleting object: {err}")
        return False
