import clientPromise, { checkMongoConnection } from "./mongo-client";
// import * as dotenv from "dotenv";
// import path from "path";

let isInitialized = false;

export async function getMongoClient() {
  if (!isInitialized) {
    // dotenv.config({ path: path.resolve(process.cwd(), ".env") });
    await checkMongoConnection();
    isInitialized = true;
  }
  return clientPromise;
}

export default getMongoClient;
