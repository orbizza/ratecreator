import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  generateUploadUrl,
  UploadValidationError,
} from "@ratecreator/actions/storage";
import { requireWriter } from "@ratecreator/actions/content";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await requireWriter(userId);

    const body = (await request.json()) as {
      folderName?: unknown;
      fileType?: unknown;
    };
    const folderName =
      typeof body.folderName === "string" ? body.folderName : "";
    const fileType = typeof body.fileType === "string" ? body.fileType : "";

    const result = await generateUploadUrl(folderName, fileType, "content");

    return NextResponse.json({
      uploadURL: result.uploadURL,
      s3URL: result.publicURL,
      fileName: result.fileName,
      provider: result.provider,
    });
  } catch (error) {
    if (error instanceof UploadValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 },
    );
  }
}
