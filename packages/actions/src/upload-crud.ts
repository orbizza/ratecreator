"use server";

import { makeFilePublic as _makeFilePublic, deleteFile } from "./storage";

export async function makeFilePublic(fileName: string) {
  return _makeFilePublic(fileName);
}

export async function deleteFileFromBucket(fileUrl: string) {
  return deleteFile(fileUrl);
}
