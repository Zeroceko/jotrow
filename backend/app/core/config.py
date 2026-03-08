from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "JOTROW API"
    DATABASE_URL: str
    
    SECRET_KEY: str = "supersecretkey_please_change_in_production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    
    MINIO_ENDPOINT: str
    MINIO_ACCESS_KEY: str
    MINIO_SECRET_KEY: str
    MINIO_SECURE: bool | None = None
    MINIO_BUCKET_NAME: str = "notlar-images"

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
