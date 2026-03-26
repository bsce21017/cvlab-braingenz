// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  BlobServiceClient,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
} from '@azure/storage-blob';
import { v4 as uuidv4 } from 'uuid';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

// Validate required environment variables
const requiredEnvVars = [
  'AZURE_STORAGE_CONNECTION_STRING',
  'AZURE_STORAGE_ACCOUNT_NAME',
  'AZURE_STORAGE_ACCOUNT_KEY',
  'AZURE_CONTAINER_NAME',
];

const validateEnvironment = () => {
  const missing = requiredEnvVars.filter(varName => !process.env[varName]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. ` +
      'Please set these in your environment file and restart the Next.js dev server.'
    );
  }
};

// Configure Azure Blob Storage Client
let blobServiceClient: BlobServiceClient;

try {
  validateEnvironment();
  blobServiceClient = BlobServiceClient.fromConnectionString(
    process.env.AZURE_STORAGE_CONNECTION_STRING!
  );
} catch (error) {
  console.error('Failed to initialize Azure Blob Storage client:', error);
}

// Verify auth token (JWT from custom backend)
async function verifyAuth(req: NextRequest): Promise<{ userId: string } | null> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);

  // Decode JWT payload to get user ID (token is already verified by backend middleware)
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;
    return { userId: payload.sub };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    try {
      validateEnvironment();
    } catch (envError: any) {
      return NextResponse.json(
        { error: 'Server configuration error', details: envError.message },
        { status: 500 }
      );
    }

    // Verify authentication
    const auth = await verifyAuth(req);
    // AUTH_GATE_DISABLED: Keep original unauthorized block for easy restore.
    // if (!auth) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }
    const userId = auth?.userId || `guest-${uuidv4()}`;

    // Parse form data
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF and DOC files are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Convert File to Buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileExtension = file.name.split('.').pop();
    const blobName = `${userId}/${uuidv4()}.${fileExtension}`;

    // Upload to Azure Blob Storage
    const containerClient = blobServiceClient.getContainerClient(
      process.env.AZURE_CONTAINER_NAME || 'resumes'
    );
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.upload(buffer, buffer.length, {
      blobHTTPHeaders: { blobContentType: file.type },
    });

    // Generate a SAS URL (valid for 1 hour)
    const sharedKeyCredential = new StorageSharedKeyCredential(
      process.env.AZURE_STORAGE_ACCOUNT_NAME!,
      process.env.AZURE_STORAGE_ACCOUNT_KEY!
    );

    const sasToken = generateBlobSASQueryParameters(
      {
        containerName: process.env.AZURE_CONTAINER_NAME || 'resumes',
        blobName,
        permissions: BlobSASPermissions.parse('r'),
        expiresOn: new Date(Date.now() + 3600 * 1000),
      },
      sharedKeyCredential
    );

    const fileUrl = blockBlobClient.url;
    const presignedUrl = `${fileUrl}?${sasToken}`;

    // Debug: Log the uploaded file URL
    console.log('File uploaded successfully!');
    console.log('File URL (direct):', fileUrl);
    console.log('Presigned URL (accessible):', presignedUrl);
    console.log('Original Name:', file.name);

    return NextResponse.json({
      success: true,
      fileUrl,
      presignedUrl,
      key: blobName,
      originalName: file.name,
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed', details: error.message },
      { status: 500 }
    );
  }
}
