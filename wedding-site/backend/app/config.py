from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str
    invite_token_full: str
    invite_token_reception: str
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    session_cookie_name: str = "wss"

    s3_bucket: str = "im-malaysia-wedding"
    s3_region: str = "ap-southeast-1"
    s3_access_key: str = ""
    s3_secret_key: str = ""
    # Prefix prepended to every object key, e.g. "guest-uploaded-photo"
    s3_key_prefix: str = "guest-uploaded-photo"
    # Base URL for public object access. Leave blank to use the default
    # virtual-hosted S3 URL: https://{bucket}.s3.{region}.amazonaws.com
    s3_public_url_base: str = ""

    # Admin
    admin_username: str = "admin"
    admin_password: str = "wedding2026!"  # override in production
    admin_cookie_name: str = "wsa"
    admin_jwt_expire_hours: int = 24

    # Used in QR code URLs
    site_url: str = "http://localhost:3000"


settings = Settings()
