import { NextResponse } from "next/server";
import { generateUploadUrl } from "@ratecreator/actions/storage";

export async function POST(request: Request) {
  try {
    const { folderName, fileType } = await request.json();

    const result = await generateUploadUrl(folderName, fileType, "content");

    return NextResponse.json({
      uploadURL: result.uploadURL,
      s3URL: result.publicURL,
      fileName: result.fileName,
      provider: result.provider,
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 },
    );
  }
}
