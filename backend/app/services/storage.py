import io
import uuid
import boto3
from botocore.client import Config
from PIL import Image
from app.config import settings

# ─── S3 / MinIO Client ───────────────────────────────────────────────────────
s3_client = boto3.client(
    's3',
    endpoint_url=f'http://{settings.MINIO_ENDPOINT}',
    aws_access_key_id=settings.MINIO_ACCESS_KEY,
    aws_secret_access_key=settings.MINIO_SECRET_KEY,
    config=Config(signature_version='s3v4'),
    region_name='us-east-1'
)

BUCKET = settings.MINIO_BUCKET
MAX_SIZE = 1200       # piksel cinsinden maksimum kenar uzunluğu
JPEG_QUALITY = 72     # %72 kalite → ~%70+ küçülme


def _ensure_bucket():
    """Bucket yoksa oluştur."""
    try:
        s3_client.head_bucket(Bucket=BUCKET)
    except Exception:
        s3_client.create_bucket(Bucket=BUCKET)


_ensure_bucket()


# ─── Upload ──────────────────────────────────────────────────────────────────
async def upload_file(file, user_id: int) -> str:
    """
    Yüklenen görseli Pillow ile sıkıştırıp MinIO'ya yükler.
    Dönen değer: object_key (presigned URL için kullanılır)
    """
    file_id = str(uuid.uuid4())
    object_key = f"users/{user_id}/notes/{file_id}.jpg"  # her zaman JPEG

    # 1) Ham bytes'ı oku
    raw_bytes = await file.read()

    # 2) Pillow ile aç ve EXIF orientasyonunu düzelt
    img = Image.open(io.BytesIO(raw_bytes))

    # EXIF otomatik orientation
    try:
        from PIL import ImageOps
        img = ImageOps.exif_transpose(img)
    except Exception:
        pass

    # RGB'ye dönüştür (PNG/RGBA vb. olabilir)
    if img.mode not in ("RGB", "L"):
        img = img.convert("RGB")

    # 3) Boyutlandır (aspect ratio koru)
    if img.width > MAX_SIZE or img.height > MAX_SIZE:
        img.thumbnail((MAX_SIZE, MAX_SIZE), Image.LANCZOS)

    # 4) BytesIO buffer'a JPEG olarak kaydet (bilinen boyut)
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=JPEG_QUALITY, optimize=True)
    buf.seek(0)
    content_length = buf.getbuffer().nbytes

    # 5) MinIO'ya yükle — length belirtilmeden çakılıyor, bu yüzden kesin veri
    s3_client.put_object(
        Bucket=BUCKET,
        Key=object_key,
        Body=buf,
        ContentType="image/jpeg",
        ContentLength=content_length,
    )

    return object_key


# ─── Presigned URL ───────────────────────────────────────────────────────────
def get_file_url(object_key: str, expires: int = 3600) -> str:
    """1 saatlik presigned URL döndür."""
    return s3_client.generate_presigned_url(
        'get_object',
        Params={'Bucket': BUCKET, 'Key': object_key},
        ExpiresIn=expires
    )


# ─── Delete ──────────────────────────────────────────────────────────────────
def delete_file(object_key: str):
    """MinIO'dan dosya sil."""
    try:
        s3_client.delete_object(Bucket=BUCKET, Key=object_key)
    except Exception:
        pass
