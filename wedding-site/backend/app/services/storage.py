import json

import boto3
from botocore.client import Config
from botocore.exceptions import ClientError

from app.config import settings

_client = None


def _get_s3():
    global _client
    if _client is None:
        _client = boto3.client(
            "s3",
            endpoint_url=settings.minio_endpoint,
            aws_access_key_id=settings.minio_access_key,
            aws_secret_access_key=settings.minio_secret_key,
            config=Config(signature_version="s3v4"),
            region_name="us-east-1",
        )
    return _client


def ensure_bucket() -> None:
    s3 = _get_s3()
    try:
        s3.head_bucket(Bucket=settings.minio_bucket)
    except ClientError:
        s3.create_bucket(Bucket=settings.minio_bucket)

    policy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {"AWS": "*"},
                "Action": "s3:GetObject",
                "Resource": f"arn:aws:s3:::{settings.minio_bucket}/*",
            }
        ],
    }
    s3.put_bucket_policy(Bucket=settings.minio_bucket, Policy=json.dumps(policy))


def upload(key: str, data: bytes, content_type: str) -> None:
    _get_s3().put_object(
        Bucket=settings.minio_bucket,
        Key=key,
        Body=data,
        ContentType=content_type,
    )


def public_url(key: str) -> str:
    return f"{settings.minio_public_url}/{settings.minio_bucket}/{key}"


def delete_objects(keys: list[str]) -> None:
    if not keys:
        return
    _get_s3().delete_objects(
        Bucket=settings.minio_bucket,
        Delete={"Objects": [{"Key": k} for k in keys], "Quiet": True},
    )
