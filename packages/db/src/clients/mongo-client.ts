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
  var _mongoClientPromise: Promise<MongoClient>;
}

/**
 * MongoDB client instance
 * @private
 */
let client: MongoClient;

/**
 * Promise resolving to MongoDB client instance
 * @private
 */
let clientPromise: Promise<MongoClient>;

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

// Initialize client based on environment
if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    // console.log("Initializing global MongoDB client for development");
    global._mongoClientPromise = createMongoClient(); // Force initialization
  } else {
    // console.log("MongoDB client already initialized globally");
  }
  clientPromise = global._mongoClientPromise;
} else {
  // console.log("Initializing MongoDB client for production");
  clientPromise = createMongoClient();
}

export default clientPromise;

/**
 * Checks the MongoDB connection status
 * @returns {Promise<boolean>} Promise resolving to true if connection is successful
 */
export async function checkMongoConnection() {
  try {
    const client = await clientPromise;
    await client.db().command({ ping: 1 });
    // console.log("MongoDB connection check successful");
    return true;
  } catch (error) {
    console.error("MongoDB connection check failed:", error);
    return false;
  }
}
