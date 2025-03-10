"use server";
import {
  S3Client,
  PutObjectAclCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  endpoint: process.env.DO_SPACES_ENDPOINT,
  region: process.env.DO_SPACES_REGION,
  credentials: {
    accessKeyId: process.env.DO_SPACES_KEY!,
    secretAccessKey: process.env.DO_SPACES_SECRET!,
  },
});

export async function makeFilePublic(fileName: string) {
  try {
    await s3Client.send(
      new PutObjectAclCommand({
        Bucket: process.env.DO_SPACES_BUCKET as string,
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

export async function deleteFileFromBucket(fileUrl: string) {
  try {
    if (!fileUrl) {
      return { error: "File URL is required" };
    }

    // Extract the file key from the URL
    const bucketName = process.env.DO_SPACES_BUCKET;
    const region = process.env.DO_SPACES_REGION;
    const baseUrl = `https://${bucketName}.${region}.cdn.digitaloceanspaces.com/`;

    if (!fileUrl.startsWith(baseUrl)) {
      return {
        error: "Invalid URL. The URL does not belong to the configured bucket.",
      };
    }

    // Extract file path (after the base URL)
    const fileKey = fileUrl.replace(baseUrl, "");

    // Send request to delete the file
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: fileKey,
      }),
    );

    console.log(`File deleted successfully: ${fileUrl}`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting file:", error);
    return { error: "Failed to delete file" };
  }
}
