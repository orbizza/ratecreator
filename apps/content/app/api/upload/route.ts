"use server";

import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

// Initialize the S3 client
const s3Client = new S3Client({
  endpoint: process.env.DO_SPACES_ENDPOINT,
  region: process.env.DO_SPACES_REGION,
  credentials: {
    accessKeyId: process.env.DO_SPACES_KEY!,
    secretAccessKey: process.env.DO_SPACES_SECRET!,
  },
});

export async function POST(request: Request) {
  try {
    const { folderName, fileType } = await request.json();
    const fileExtension = fileType.split("/")[1];
    const fileName = `${folderName}/${uuidv4()}.${fileExtension}`;

    // Create the command for the PUT operation
    const command = new PutObjectCommand({
      Bucket: process.env.DO_SPACES_BUCKET as string,
      Key: fileName,
      ContentType: fileType,
      ACL: "public-read",
      Metadata: {
        "Content-Type": fileType,
      },
    });

    // Generate the presigned URL
    const uploadURL = await getSignedUrl(s3Client, command, { expiresIn: 600 });

    const s3URL = `https://${process.env.DO_SPACES_BUCKET}.${process.env.DO_SPACES_REGION}.cdn.digitaloceanspaces.com/${fileName}`;

    return NextResponse.json({
      uploadURL,
      s3URL,
      fileName,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}
