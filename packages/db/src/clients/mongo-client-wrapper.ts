/**
 * @fileoverview MongoDB client wrapper for Rate Creator platform
 * @module clients/mongo-client-wrapper
 * @description Provides a wrapper around the MongoDB client with additional functionality
 * for connection management, error handling, and retry logic.
 */

import clientPromise, { checkMongoConnection } from "./mongo-client";

/**
 * Flag indicating if the MongoDB client has been initialized
 * @private
 */
let isInitialized = false;

/**
 * Returns a MongoDB client instance with connection check
 * @returns {Promise<MongoClient>} Promise resolving to MongoDB client
 * @throws {Error} If connection check fails
 */
export async function getMongoClient() {
  if (!isInitialized) {
    await checkMongoConnection();
    isInitialized = true;
  }
  return clientPromise;
}

export default getMongoClient;
