import Redis from "ioredis";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// You can store these in environment variables for better security
const redis = new Redis({
  host: process.env.REDIS_HOST || "",
  username: process.env.REDIS_USERNAME || "",
  port: parseInt(process.env.REDIS_PORT || "25061", 10), // default Redis port for DO managed
  password: process.env.REDIS_PASSWORD || "",
  tls: {},
});

// Log connection errors
redis.on("error", (err) => {
  console.error("Redis connection error:", err);
});

export default redis;
