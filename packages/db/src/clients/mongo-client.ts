import { MongoClient } from "mongodb";

declare global {
  var _mongoClientPromise: Promise<MongoClient>;
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

function getMongoURI(): string {
  const uri = process.env.DATABASE_URL_ONLINE || "";
  if (!uri) {
    console.error("DATABASE_URL_ONLINE is not set.");
  }
  // console.log("MongoDB URI:", uri);
  return uri;
}

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
