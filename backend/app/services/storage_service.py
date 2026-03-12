import boto3
from botocore.client import Config
import os
from datetime import timedelta

class StorageService:
    def __init__(self):
        self.client = boto3.client(
            's3',
            endpoint_url=f"http://{os.getenv('MINIO_ENDPOINT', 'localhost:9000')}",
            aws_access_key_id=os.getenv('MINIO_ACCESS_KEY', 'minioadmin'),
            aws_secret_access_key=os.getenv('MINIO_SECRET_KEY', 'minioadmin'),
            config=Config(signature_version='s3v4'),
            region_name='us-east-1'
        )
        self.bucket = 'notlar-burada'
        self._ensure_bucket()
    
    def _ensure_bucket(self):
        try:
            self.client.head_bucket(Bucket=self.bucket)
        except:
            self.client.create_bucket(Bucket=self.bucket)
    
    def upload_file(self, file_path: str, object_name: str) -> str:
        """Dosya yükle ve URL döndür"""
        self.client.upload_file(file_path, self.bucket, object_name)
        return f"{self.bucket}/{object_name}"
    
    def get_presigned_url(self, object_name: str, expiration=3600) -> str:
        """İmzalı URL oluştur"""
        url = self.client.generate_presigned_url(
            'get_object',
            Params={'Bucket': self.bucket, 'Key': object_name},
            ExpiresIn=expiration
        )
        return url
    
    def delete_file(self, object_name: str):
        """Dosya sil"""
        self.client.delete_object(Bucket=self.bucket, Key=object_name)
