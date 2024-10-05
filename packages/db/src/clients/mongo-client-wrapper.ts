import clientPromise, { checkMongoConnection } from "./mongo-client";

let isInitialized = false;

export async function getMongoClient() {
  if (!isInitialized) {
    await checkMongoConnection();
    isInitialized = true;
  }
  return clientPromise;
}

export default getMongoClient;
