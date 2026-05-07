import {
  S3Client,
  PutObjectCommand,
  PutObjectAclCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Storage } from "@google-cloud/storage";
import { v4 as uuidv4 } from "uuid";

// ── Types ───────────────────────────────────────────────────

type StorageProvider = "do" | "gcs";
type BucketType = "content" | "profiles" | "banners";

function getProvider(): StorageProvider {
  return (process.env.STORAGE_PROVIDER as StorageProvider) || "do";
}

// ── DO Spaces Client ────────────────────────────────────────

let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      endpoint: process.env.DO_SPACES_ENDPOINT,
      region: process.env.DO_SPACES_REGION,
      credentials: {
        accessKeyId: process.env.DO_SPACES_KEY!,
        secretAccessKey: process.env.DO_SPACES_SECRET!,
      },
    });
  }
  return s3Client;
}

// ── GCS Client ──────────────────────────────────────────────

let gcsClient: Storage | null = null;

function getGCSClient(): Storage {
  if (!gcsClient) {
    const base64Key = process.env.GCP_SERVICE_ACCOUNT_KEY_BASE64;
    if (base64Key) {
      const credentials = JSON.parse(
        Buffer.from(base64Key, "base64").toString("utf-8"),
      );
      gcsClient = new Storage({
        projectId: process.env.GCP_PROJECT_ID,
        credentials,
      });
    } else {
      gcsClient = new Storage({ projectId: process.env.GCP_PROJECT_ID });
    }
  }
  return gcsClient;
}

// ── Bucket mapping ──────────────────────────────────────────

function getDOBucket(): string {
  return process.env.DO_SPACES_BUCKET || "ratecreator";
}

function getGCSBucketName(type: BucketType): string {
  switch (type) {
    case "content":
      return process.env.GCS_CONTENT_BUCKET || "rc-content";
    case "profiles":
      return process.env.GCS_PROFILES_BUCKET || "rc-profiles";
    case "banners":
      return process.env.GCS_BANNERS_BUCKET || "rc-banners";
  }
}

function getDOPublicUrl(fileName: string): string {
  const bucket = getDOBucket();
  const region = process.env.DO_SPACES_REGION || "nyc3";
  return `https://${bucket}.${region}.cdn.digitaloceanspaces.com/${fileName}`;
}

function getGCSPublicUrl(bucketName: string, fileName: string): string {
  return `https://storage.googleapis.com/${bucketName}/${fileName}`;
}

// ── Upload ──────────────────────────────────────────────────

export interface UploadResult {
  uploadURL: string;
  publicURL: string;
  fileName: string;
  provider: string;
}

// Allowlists prevent (a) path traversal in the bucket key and (b) writers
// uploading text/html with public-read ACL — which would let them host XSS
// payloads on the *.digitaloceanspaces.com / storage.googleapis.com origin.
const ALLOWED_FOLDERS = new Set([
  "editor-images",
  "blog",
  "youtube",
  "tags",
  "feature",
  "newsletter",
  "glossary",
  "profile",
]);

const ALLOWED_MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

export class UploadValidationError extends Error {}

function validateUpload(folderName: string, fileType: string): string {
  if (!folderName || typeof folderName !== "string") {
    throw new UploadValidationError("folderName is required");
  }
  if (!ALLOWED_FOLDERS.has(folderName)) {
    throw new UploadValidationError(`folderName not allowed: ${folderName}`);
  }
  const ext = ALLOWED_MIME_TO_EXT[fileType?.toLowerCase()];
  if (!ext) {
    throw new UploadValidationError(`fileType not allowed: ${fileType}`);
  }
  return ext;
}

/**
 * Generate a presigned upload URL.
 *
 * @param folderName — path within bucket (e.g. "editor-images", "youtube")
 * @param fileType — MIME type
 * @param bucketType — "content", "profiles", or "banners"
 */
export async function generateUploadUrl(
  folderName: string,
  fileType: string,
  bucketType: BucketType = "content",
): Promise<UploadResult> {
  const ext = validateUpload(folderName, fileType);
  const provider = getProvider();
  const fileName = `${folderName}/${uuidv4()}.${ext}`;

  if (provider === "gcs") {
    return generateGCSUploadUrl(fileName, fileType, bucketType);
  }
  return generateDOUploadUrl(fileName, fileType);
}

async function generateDOUploadUrl(
  fileName: string,
  fileType: string,
): Promise<UploadResult> {
  const client = getS3Client();
  const bucket = getDOBucket();

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: fileName,
    ContentType: fileType,
    ACL: "public-read",
    Metadata: { "Content-Type": fileType },
  });

  const uploadURL = await getSignedUrl(client, command, { expiresIn: 600 });
  const publicURL = getDOPublicUrl(fileName);

  return { uploadURL, publicURL, fileName, provider: "do" };
}

async function generateGCSUploadUrl(
  fileName: string,
  fileType: string,
  bucketType: BucketType,
): Promise<UploadResult> {
  const storage = getGCSClient();
  const bucketName = getGCSBucketName(bucketType);
  const file = storage.bucket(bucketName).file(fileName);

  const [uploadURL] = await file.getSignedUrl({
    version: "v4",
    action: "write",
    expires: Date.now() + 10 * 60 * 1000,
    contentType: fileType,
  });

  const publicURL = getGCSPublicUrl(bucketName, fileName);

  return { uploadURL, publicURL, fileName, provider: "gcs" };
}

// ── Delete ──────────────────────────────────────────────────

/**
 * Delete a file by its public URL.
 * Auto-detects DO Spaces vs GCS from the URL.
 */
export async function deleteFile(
  fileUrl: string,
): Promise<{ success: boolean; error?: string }> {
  if (!fileUrl) return { success: false, error: "File URL is required" };

  try {
    if (fileUrl.includes("digitaloceanspaces.com")) {
      return deleteFromDO(fileUrl);
    } else if (fileUrl.includes("storage.googleapis.com")) {
      return deleteFromGCS(fileUrl);
    }
    return { success: false, error: "Unknown storage provider" };
  } catch (error) {
    console.error("Error deleting file:", error);
    return { success: false, error: "Failed to delete file" };
  }
}

async function deleteFromDO(
  fileUrl: string,
): Promise<{ success: boolean; error?: string }> {
  const bucket = getDOBucket();
  const region = process.env.DO_SPACES_REGION || "nyc3";
  const baseUrl = `https://${bucket}.${region}.cdn.digitaloceanspaces.com/`;

  if (!fileUrl.startsWith(baseUrl)) {
    return { success: false, error: "URL does not match DO Spaces bucket" };
  }

  const fileKey = fileUrl.replace(baseUrl, "");
  await getS3Client().send(
    new DeleteObjectCommand({ Bucket: bucket, Key: fileKey }),
  );
  return { success: true };
}

async function deleteFromGCS(
  fileUrl: string,
): Promise<{ success: boolean; error?: string }> {
  const match = fileUrl.match(/storage\.googleapis\.com\/([^/]+)\/(.+)/);
  if (!match) return { success: false, error: "Invalid GCS URL" };

  const [, bucketName, filePath] = match;
  await getGCSClient().bucket(bucketName).file(filePath).delete();
  return { success: true };
}

// ── Make Public (DO Spaces only) ────────────────────────────

export async function makeFilePublic(
  fileName: string,
): Promise<{ success?: boolean; error?: string }> {
  try {
    await getS3Client().send(
      new PutObjectAclCommand({
        Bucket: getDOBucket(),
        Key: fileName,
        ACL: "public-read",
      }),
    );
    return { success: true };
  } catch (error) {
    console.error("Error setting file public:", error);
    return { error: "Failed to update ACL" };
  }
}
