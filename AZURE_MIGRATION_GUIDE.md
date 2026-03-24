# Environment Variables - Azure Blob Storage Migration

## Backend (.env for backend)

### Azure Blob Storage Configuration
```
# Option 1: Using Connection String (Recommended)
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=<account-name>;AccountKey=<account-key>;EndpointSuffix=core.windows.net

# Option 2: Using Account Name and Key (if not using connection string)
AZURE_STORAGE_ACCOUNT_NAME=<your-storage-account-name>
AZURE_STORAGE_ACCOUNT_KEY=<your-storage-account-key>

# Container name for resumes
AZURE_CONTAINER_NAME=resumes
```

### How to get Azure credentials:
1. **Connection String** - Azure Portal → Storage Account → Security + networking → Access keys → Copy "Connection string"
2. **Account Name** - Azure Portal → Storage Account → Overview → Storage account name
3. **Account Key** - Azure Portal → Storage Account → Security + networking → Access keys → Copy "Key"

## Frontend (.env.local for development, .env.production for production)

### Azure Blob Storage Configuration
```
# Azure connection string for file uploads
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=<account-name>;AccountKey=<account-key>;EndpointSuffix=core.windows.net

# Azure storage account name (needed for SAS URL generation)
NEXT_PUBLIC_AZURE_STORAGE_ACCOUNT_NAME=<your-storage-account-name>

# Azure storage account key (needed for SAS URL generation)
AZURE_STORAGE_ACCOUNT_KEY=<your-storage-account-key>

# Container name
AZURE_CONTAINER_NAME=resumes

# Upload API endpoint
NEXT_PUBLIC_UPLOAD_API_URL=/api/upload
```

## Old S3 Variables (No longer needed)

These variables can be removed from your .env files:
```
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_REGION
S3_BUCKET
```

## Migration Checklist

- [ ] Create Azure Storage Account (if not done)
- [ ] Create container named "resumes" (if not done)
- [ ] Get connection string from Azure Portal
- [ ] Update backend .env file with Azure variables
- [ ] Update frontend .env files with Azure variables
- [ ] Install new dependencies: `pip install azure-storage-blob` (backend)
- [ ] Install new npm packages: `npm install @azure/storage-blob` (frontend)
- [ ] Test file upload through API
- [ ] Verify files are in Azure Blob Storage container
- [ ] Delete old S3 files (optional)

## Testing the Migration

### Backend
```python
from app.services.azure_blob_service import upload_content_to_s3, get_file_content_from_s3

# Upload test
content = b"Test content"
url = upload_content_to_s3(content, "test/test.txt", "text/plain")
print(f"Uploaded to: {url}")

# Download test
retrieved = get_file_content_from_s3("test/test.txt")
print(f"Retrieved: {retrieved}")
```

### Frontend
- Upload a resume file through the UI
- Check Azure Portal to verify file appears in blob container
- Verify presigned URL works to access the file

## Troubleshooting

### "Connection string not found" error
- Ensure `AZURE_STORAGE_CONNECTION_STRING` is set in your .env file
- Verify the connection string format is correct

### "Container does not exist" error
- Verify container is created in Azure Portal
- Check `AZURE_CONTAINER_NAME` matches the actual container name (case-sensitive)

### "UnauthorizedError" when uploading
- Check Azure storage account key is correct
- Verify storage account has public read access for blob uploads

### SAS URL not working
- Ensure `AZURE_STORAGE_ACCOUNT_KEY` is set correctly on frontend
- Check that expiration time is in the future
- Verify container allows public access
