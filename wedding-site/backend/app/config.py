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


settings = Settings()
