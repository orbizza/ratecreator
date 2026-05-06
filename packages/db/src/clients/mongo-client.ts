/**
 * @fileoverview MongoDB client implementation for Rate Creator platform
 * @module clients/mongo-client
 * @description Provides a singleton client for interacting with MongoDB database,
 * handling database operations, connection management, and error handling.
 */

import { MongoClient } from "mongodb";

/**
 * Global declaration for MongoDB client promise
 * @private
 */
declare global {
  // Allow undefined so we can lazy-init without forcing a connect at boot.
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

/**
 * Gets the MongoDB connection URI from environment variables
 * @returns {string} The MongoDB connection URI
 * @throws {Error} If DATABASE_URL_ONLINE is not set
 */
function getMongoURI(): string {
  const uri = process.env.DATABASE_URL_ONLINE || "";
  if (!uri) {
    console.error("DATABASE_URL_ONLINE is not set.");
    throw new Error("DATABASE_URL_ONLINE is not set.");
  }
  // console.log("MongoDB URI:", uri);
  return uri;
}

/**
 * Creates a new MongoDB client instance
 * @returns {Promise<MongoClient>} Promise resolving to MongoDB client
 * @throws {Error} If connection fails
 */
function createMongoClient(): Promise<MongoClient> {
  // console.log("Creating new MongoDB client");
  const uri = getMongoURI();
  const newClient = new MongoClient(uri, {
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  });
  return newClient
    .connect()
    .then((client) => {
      // console.log("MongoDB connected successfully");
      return client;
    })
    .catch((error) => {
      console.error("Failed to connect to MongoDB:", error);
      throw error;
    });
}

// Lazy initialization. Connecting eagerly at module-import time turns any
// transient outage (e.g. a dev machine that's not on the prod Mongo IP
// allowlist) into an unhandled rejection that kills `turbo dev`. Defer the
// connect until something actually awaits the promise.
function getClientPromise(): Promise<MongoClient> {
  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
      global._mongoClientPromise = createMongoClient();
    }
    return global._mongoClientPromise;
  }
  // In production we reuse the lifetime of the module: the first call seeds
  // the promise, subsequent calls reuse it.
  if (!cachedClientPromise) {
    cachedClientPromise = createMongoClient();
  }
  return cachedClientPromise;
}

let cachedClientPromise: Promise<MongoClient> | undefined;

// Default export retained for backwards compatibility — but it's now a
// thenable proxy that defers the connect. Awaiting it triggers the connect;
// merely importing it does not.
const lazyDefault: PromiseLike<MongoClient> = {
  then(onFulfilled, onRejected) {
    return getClientPromise().then(onFulfilled, onRejected);
  },
};

export default lazyDefault;

/**
 * Checks the MongoDB connection status
 * @returns {Promise<boolean>} Promise resolving to true if connection is successful
 */
export async function checkMongoConnection() {
  try {
    const client = await getClientPromise();
    await client.db().command({ ping: 1 });
    return true;
  } catch (error) {
    console.error("MongoDB connection check failed:", error);
    return false;
  }
}
