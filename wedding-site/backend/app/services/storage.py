import boto3
from botocore.client import Config

from app.config import settings

_client = None


def _get_s3():
    global _client
    if _client is None:
        kwargs = dict(
            aws_access_key_id=settings.s3_access_key or None,
            aws_secret_access_key=settings.s3_secret_key or None,
            region_name=settings.s3_region,
            config=Config(signature_version="s3v4"),
        )
        _client = boto3.client("s3", **kwargs)
    return _client


def _full_key(key: str) -> str:
    """Prepend the configured prefix (if any) to an object key."""
    prefix = settings.s3_key_prefix.strip("/")
    return f"{prefix}/{key}" if prefix else key


def _public_base() -> str:
    if settings.s3_public_url_base:
        return settings.s3_public_url_base.rstrip("/")
    return f"https://{settings.s3_bucket}.s3.{settings.s3_region}.amazonaws.com"


def ensure_bucket() -> None:
    # Bucket is pre-created in AWS; nothing to do here.
    pass


def upload(key: str, data: bytes, content_type: str) -> None:
    _get_s3().put_object(
        Bucket=settings.s3_bucket,
        Key=_full_key(key),
        Body=data,
        ContentType=content_type,
    )


def public_url(key: str) -> str:
    return f"{_public_base()}/{_full_key(key)}"


def download(key: str) -> bytes:
    resp = _get_s3().get_object(Bucket=settings.s3_bucket, Key=_full_key(key))
    return resp["Body"].read()


def delete_objects(keys: list[str]) -> None:
    if not keys:
        return
    _get_s3().delete_objects(
        Bucket=settings.s3_bucket,
        Delete={"Objects": [{"Key": _full_key(k)} for k in keys], "Quiet": True},
    )
