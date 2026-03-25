// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { 
  BlobServiceClient,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  BlobSASPermissions
} from '@azure/storage-blob';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@supabase/supabase-js';

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
      `Please set these in your .env.local file and restart the Next.js dev server.`
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
  // This will cause an error on the first request, but with a clear message
}

// Verify Supabase token
async function verifyAuth(req: NextRequest): Promise<{ userId: string } | null> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return null;
  }

  return { userId: user.id };
}

export async function POST(req: NextRequest) {
  try {
    // Validate environment on each request
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
    const blobName = `resumes/${userId}/${uuidv4()}.${fileExtension}`;

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
        blobName: blobName,
        permissions: BlobSASPermissions.parse('r'), // read permission
        expiresOn: new Date(new Date().valueOf() + 3600 * 1000), // 1 hour
      },
      sharedKeyCredential
    );

    const fileUrl = blockBlobClient.url;
    const sasUrl = `${fileUrl}?${sasToken}`;

    // Debug: Log the uploaded file URL
    console.log('File uploaded successfully!');
    console.log('File URL (direct):', fileUrl);
    console.log('SAS URL (accessible):', sasUrl);
    console.log('Original Name:', file.name);

    return NextResponse.json({
      success: true,
      fileUrl,
      presignedUrl: sasUrl, // Use this URL to access the file
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
