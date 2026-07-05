from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str
    invite_token_full: str
    invite_token_reception: str
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    session_cookie_name: str = "wss"

    minio_endpoint: str = "http://minio:9000"
    minio_access_key: str = "minioadmin"
    minio_secret_key: str = "minioadmin"
    minio_bucket: str = "wedding-photos"
    minio_public_url: str = "http://localhost:9000"

    # Admin
    admin_username: str = "admin"
    admin_password: str = "wedding2026!"  # override in production
    admin_cookie_name: str = "wsa"
    admin_jwt_expire_hours: int = 24

    # Used in QR code URLs
    site_url: str = "http://localhost:3000"


settings = Settings()
