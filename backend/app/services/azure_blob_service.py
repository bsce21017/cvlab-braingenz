"""
Azure Blob Storage Service
Handles all Azure Blob operations for resume uploads and downloads
Provides same interface as s3_service.py for easy migration
"""
import logging
import os
from typing import Optional
from datetime import datetime, timedelta

from azure.storage.blob import BlobServiceClient, generate_blob_sas, BlobSasPermissions, ContentSettings
from azure.core.exceptions import AzureError

logger = logging.getLogger(__name__)

# Azure Blob Configuration
AZURE_STORAGE_CONNECTION_STRING = os.getenv('AZURE_STORAGE_CONNECTION_STRING')
AZURE_CONTAINER_NAME = os.getenv('AZURE_CONTAINER_NAME', 'resumes')
AZURE_STORAGE_ACCOUNT_NAME = os.getenv('AZURE_STORAGE_ACCOUNT_NAME')
AZURE_STORAGE_ACCOUNT_KEY = os.getenv('AZURE_STORAGE_ACCOUNT_KEY')


def get_blob_service_client():
    """Get configured Azure Blob Service Client"""
    if AZURE_STORAGE_CONNECTION_STRING:
        return BlobServiceClient.from_connection_string(AZURE_STORAGE_CONNECTION_STRING)
    else:
        return BlobServiceClient(
            account_url=f"https://{AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net",
            credential=AZURE_STORAGE_ACCOUNT_KEY
        )


def download_file_from_azure(blob_name: str, local_path: str) -> bool:
    """
    Download a file from Azure Blob Storage to local path

    Args:
        blob_name: The blob name (path in container)
        local_path: Local file path to save to

    Returns:
        bool: True if successful, False otherwise
    """
    try:
        content = get_file_content_from_azure(blob_name)
        if content is None:
            logger.error(f"Failed to get file content from Azure: {blob_name}")
            return False
        
        # Write content to local file
        os.makedirs(os.path.dirname(local_path), exist_ok=True)
        with open(local_path, 'wb') as f:
            f.write(content)
        
        logger.info(f"Downloaded {blob_name} to {local_path}")
        return True
    except Exception as e:
        logger.error(f"Failed to download from Azure: {e}")
        return False


def upload_file_to_azure(
    local_path: str,
    blob_name: str,
    content_type: str = 'application/octet-stream'
) -> Optional[str]:
    """
    Upload a file to Azure Blob Storage

    Args:
        local_path: Local file path
        blob_name: Blob name (path in container)
        content_type: MIME type of the file

    Returns:
        str: Blob URL if successful, None otherwise
    """
    try:
        blob_service_client = get_blob_service_client()
        blob_client = blob_service_client.get_blob_client(
            container=AZURE_CONTAINER_NAME,
            blob=blob_name
        )

        with open(local_path, 'rb') as data:
            blob_client.upload_blob(data, overwrite=True, content_settings=ContentSettings(content_type=content_type))

        blob_url = blob_client.url
        logger.info(f"Uploaded {local_path} to {blob_url}")
        return blob_url

    except AzureError as e:
        logger.error(f"Failed to upload to Azure: {e}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error uploading to Azure: {e}")
        return None


def upload_content_to_azure(
    content: bytes,
    blob_name: str,
    content_type: str = 'text/plain'
) -> Optional[str]:
    """
    Upload content directly to Azure Blob Storage (without saving to local file first)

    Args:
        content: Bytes content to upload
        blob_name: Blob name (path in container)
        content_type: MIME type

    Returns:
        str: Blob URL if successful, None otherwise
    """
    try:
        blob_service_client = get_blob_service_client()
        blob_client = blob_service_client.get_blob_client(
            container=AZURE_CONTAINER_NAME,
            blob=blob_name
        )

        blob_client.upload_blob(content, overwrite=True, content_settings=ContentSettings(content_type=content_type))

        blob_url = blob_client.url
        logger.info(f"Uploaded content to {blob_url}")
        return blob_url

    except AzureError as e:
        logger.error(f"Failed to upload content to Azure: {e}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error uploading content to Azure: {e}")
        return None


def get_sas_url(blob_name: str, expiration_hours: int = 1, filename: Optional[str] = None) -> Optional[str]:
    """
    Generate a SAS (Shared Access Signature) URL for downloading a file

    Args:
        blob_name: Blob name (path in container)
        expiration_hours: URL expiration time in hours (default 1 hour)
        filename: Optional filename for Content-Disposition header

    Returns:
        str: SAS URL if successful, None otherwise
    """
    try:
        blob_service_client = get_blob_service_client()
        
        # Generate SAS token
        sas_token = generate_blob_sas(
            account_name=AZURE_STORAGE_ACCOUNT_NAME,
            container_name=AZURE_CONTAINER_NAME,
            blob_name=blob_name,
            account_key=AZURE_STORAGE_ACCOUNT_KEY,
            permission=BlobSasPermissions(read=True),
            expiry=datetime.utcnow() + timedelta(hours=expiration_hours)
        )

        blob_client = blob_service_client.get_blob_client(
            container=AZURE_CONTAINER_NAME,
            blob=blob_name
        )

        # Add SAS token to blob URL
        sas_url = f"{blob_client.url}?{sas_token}"

        # Add content disposition if filename provided
        if filename:
            sas_url += f"&response-content-disposition=attachment%3Bfilename%3D%22{filename}%22"

        return sas_url

    except AzureError as e:
        logger.error(f"Failed to generate SAS URL: {e}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error generating SAS URL: {e}")
        return None


def get_file_content_from_azure(blob_name: str) -> Optional[bytes]:
    """
    Get file content directly from Azure Blob Storage

    Args:
        blob_name: Blob name (path in container)

    Returns:
        bytes: File content if successful, None otherwise
    """
    try:
        blob_service_client = get_blob_service_client()
        blob_client = blob_service_client.get_blob_client(
            container=AZURE_CONTAINER_NAME,
            blob=blob_name
        )

        download_stream = blob_client.download_blob()
        content = download_stream.readall()

        return content

    except AzureError as e:
        logger.error(f"Failed to get file from Azure: {e}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error getting file from Azure: {e}")
        return None


def delete_file_from_azure(blob_name: str) -> bool:
    """
    Delete a file from Azure Blob Storage

    Args:
        blob_name: Blob name (path in container)

    Returns:
        bool: True if successful, False otherwise
    """
    try:
        blob_service_client = get_blob_service_client()
        blob_client = blob_service_client.get_blob_client(
            container=AZURE_CONTAINER_NAME,
            blob=blob_name
        )

        blob_client.delete_blob()
        logger.info(f"Deleted blob: {blob_name}")
        return True

    except AzureError as e:
        logger.error(f"Failed to delete blob from Azure: {e}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error deleting blob from Azure: {e}")
        return False


# Convenience function names that mirror S3 service for compatibility
def download_file_from_s3(blob_name: str, local_path: str) -> bool:
    """Compatibility wrapper - calls Azure download"""
    return download_file_from_azure(blob_name, local_path)


def upload_content_to_s3(content: bytes, blob_name: str, content_type: str = 'text/plain') -> Optional[str]:
    """Compatibility wrapper - calls Azure upload"""
    return upload_content_to_azure(content, blob_name, content_type)


def get_file_content_from_s3(blob_name: str) -> Optional[bytes]:
    """Compatibility wrapper - calls Azure get content"""
    return get_file_content_from_azure(blob_name)
