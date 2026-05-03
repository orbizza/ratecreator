"use server";

import { auth } from "@clerk/nextjs/server";

import { makeFilePublic as _makeFilePublic, deleteFile } from "./storage";
import { requireWriter } from "./content/roles";

async function requireUploader() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  await requireWriter(userId);
}

export async function makeFilePublic(fileName: string) {
  await requireUploader();
  return _makeFilePublic(fileName);
}

export async function deleteFileFromBucket(fileUrl: string) {
  await requireUploader();
  return deleteFile(fileUrl);
}
