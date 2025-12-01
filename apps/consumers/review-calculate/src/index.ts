import {
  getKafkaConsumer,
  getKafkaProducer,
  createTopicIfNotExists,
  disconnectProducer,
} from "@ratecreator/db/kafka-client";
import { getPrismaClient } from "@ratecreator/db/client";
import { getRedisClient } from "@ratecreator/db/redis-do";
import { getMongoClient } from "@ratecreator/db/mongo-client";
import { ObjectId } from "mongodb";

const prisma = getPrismaClient();
const redis = getRedisClient();
let consumer: ReturnType<typeof getKafkaConsumer>;

function simpleAverage(
  currentAvgRating: number,
  newRating: number,
  reviewCount: number
) {
  return (currentAvgRating * reviewCount + newRating) / (reviewCount + 1);
}

function bayesianAverage(
  currentAvgRating: number,
  newRating: number,
  reviewCount: number
) {
  const C = 3.5; // Prior mean (global average rating)
  const m = 10; // Prior weight (confidence parameter)
  const n = reviewCount + 1; // Include the new rating
  const R = (currentAvgRating * reviewCount + newRating) / n; // New average including the new rating

  // Bayesian weighted average formula: (C * m + R * n) / (m + n)
  return (C * m + R * n) / (m + n);
}

const CACHE_YOUTUBE_CREATOR = "accounts-youtube-";
const CACHE_TWITTER_CREATOR = "accounts-twitter-";
const CACHE_TIKTOK_CREATOR = "accounts-tiktok-";
const CACHE_REDDIT_CREATOR = "accounts-reddit-";

async function processMessage(message: any) {
  if (!message.value || !message.key) {
    console.error("Invalid message: value or key is null");
    return;
  }

  const payload = JSON.parse(message.value.toString());

  try {
    const accountId = payload.accountId;
    const rating = payload.rating;
    const platform = payload.platform;
    const account = await prisma.account.findUnique({
      where: {
        platform_accountId: {
          platform: platform,
          accountId: accountId,
        },
      },
      select: { id: true },
    });

    if (!account) {
      console.error(`Account ${accountId} for platform ${platform} not found`);
      return;
    }

    // Use raw MongoDB aggregation queries with timeout to prevent transaction timeout
    // Query only published, non-deleted reviews
    console.log(`Aggregating reviews for account ${accountId}...`);

    // Get MongoDB client once and reuse it
    const mongoClient = await getMongoClient();
    const db = mongoClient.db("ratecreator");

    let newReviewCount = 0;
    let aggregatedAvg: number | null = null;

    try {
      // Use raw MongoDB aggregation with maxTimeMS to prevent timeout
      // Set timeout to 30 seconds (less than typical transaction lifetime limit)
      const [countResult, avgResult] = await Promise.all([
        db.collection("Review").countDocuments(
          {
            accountId: new ObjectId(account.id),
            isDeleted: false,
            status: "PUBLISHED",
          },
          { maxTimeMS: 30000 }
        ),
        db
          .collection("Review")
          .aggregate(
            [
              {
                $match: {
                  accountId: new ObjectId(account.id),
                  isDeleted: false,
                  status: "PUBLISHED",
                },
              },
              {
                $group: {
                  _id: null,
                  avgStars: { $avg: "$stars" },
                },
              },
            ],
            { maxTimeMS: 30000 }
          )
          .toArray(),
      ]);

      newReviewCount = countResult;
      aggregatedAvg =
        avgResult.length > 0 && avgResult[0].avgStars !== null
          ? avgResult[0].avgStars
          : null;
    } catch (error) {
      console.error(
        `Aggregation query failed for account ${accountId}:`,
        error
      );
      throw error;
    }

    const newAvgRating =
      aggregatedAvg !== null ? Number(aggregatedAvg.toFixed(2)) : rating;

    console.log(
      `Account ${accountId}: ${newReviewCount} reviews, avg rating ${newAvgRating}`
    );

    // Update MongoDB directly to avoid Prisma transaction timeout issues
    // Prisma wraps MongoDB operations in transactions which can exceed transaction lifetime limits
    // Using raw MongoDB update avoids this issue
    const mongoResult = await db.collection("Account").updateOne(
      { _id: new ObjectId(account.id) },
      {
        $set: {
          rating: newAvgRating,
          reviewCount: newReviewCount,
          updatedAt: new Date(),
        },
      },
      { maxTimeMS: 10000 } // 10 second timeout for update
    );

    if (mongoResult.modifiedCount > 0 || mongoResult.matchedCount > 0) {
      console.log(
        `Updated MongoDB for account ${accountId}: rating=${newAvgRating}, count=${newReviewCount}`
      );
    } else {
      console.warn(`No document matched for account ${accountId} update`);
    }

    let cacheKey = "";

    switch (platform) {
      case "YOUTUBE":
        cacheKey = `${CACHE_YOUTUBE_CREATOR}${accountId}`;
        break;
      case "TWITTER":
        cacheKey = `${CACHE_TWITTER_CREATOR}${accountId}`;
        break;
      case "TIKTOK":
        cacheKey = `${CACHE_TIKTOK_CREATOR}${accountId}`;
        break;
      case "REDDIT":
        cacheKey = `${CACHE_REDDIT_CREATOR}${accountId}`;
        break;
      default:
        throw new Error(`Invalid platform: ${platform}`);
    }

    // Get existing cached data
    const cachedData = await redis.get(cacheKey);

    if (cachedData) {
      // If cache exists, update only rating and reviewCount
      const existingData = JSON.parse(cachedData);
      const updatedData = {
        ...existingData,
        account: {
          ...existingData.account,
          rating: newAvgRating,
          reviewCount: newReviewCount,
        },
      };
      await redis.set(cacheKey, JSON.stringify(updatedData));

      console.log(
        `Updated Redis cache for account ${accountId} of platform ${platform}`
      );
    }

    try {
      const producer = await getKafkaProducer();
      const topicName = "new-review-algolia-update";
      await createTopicIfNotExists(topicName);

      const maxRetries = 3;
      let retryCount = 0;

      while (retryCount < maxRetries) {
        try {
          await producer.send({
            topic: topicName,
            messages: [
              {
                value: JSON.stringify({
                  objectID: accountId,
                  rating: newAvgRating,
                  reviewCount: newReviewCount,
                }),
              },
            ],
          });
          console.log(
            `Sent message to algolia-update for account ${accountId} of platform ${platform}`
          );
          break;
        } catch (error) {
          retryCount++;
          console.error(
            `Failed to send message to Kafka (attempt ${retryCount}/${maxRetries}):`,
            error
          );
          if (retryCount === maxRetries) {
            throw error;
          }
          // Wait before retrying
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * retryCount)
          );
        }
      }
    } catch (error) {
      console.error("Error sending message to Kafka:", error);
    }
  } catch (error) {
    console.error(
      `Error processing message for rating in ${payload.accountId} of platform ${payload.platform}:`,
      error
    );
  }
}

async function startConsumer() {
  try {
    consumer = getKafkaConsumer("review-calculate-group");

    // Add connection error handler
    consumer.on("consumer.connect", () => {
      console.log("Consumer connected successfully");
    });

    consumer.on("consumer.disconnect", () => {
      console.log("Consumer disconnected");
    });

    consumer.on("consumer.crash", (error) => {
      console.error("Consumer crashed:", error);
    });

    await consumer.connect();
    await consumer.subscribe({
      topic: "new-review-calculate",
      fromBeginning: true,
    });

    console.log("Consumer started and subscribed to new-review-calculate");

    await consumer.run({
      eachMessage: async ({ message }) => {
        console.log("Received message:", message?.value?.toString());
        await processMessage(message);
      },
    });
  } catch (error) {
    console.error("Failed to start consumer:", error);
    // Try to reconnect after a delay
    setTimeout(() => {
      console.log("Attempting to reconnect...");
      startConsumer().catch(console.error);
    }, 5000);
  }
}

async function stopConsumer() {
  if (consumer) {
    await consumer.disconnect();
  }
  await prisma.$disconnect();
  await disconnectProducer();
  console.log("Consumer, producer, and database connections closed");
}

// Handle graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM signal received. Shutting down...");
  await stopConsumer();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT signal received. Shutting down...");
  await stopConsumer();
  process.exit(0);
});

// Start the consumer if this is the main module
if (require.main === module) {
  console.log("Starting review-calculate consumer service...");
  startConsumer().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}
