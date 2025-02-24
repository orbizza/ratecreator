import {
  getKafkaConsumer,
  getKafkaProducer,
  createTopicIfNotExists,
  disconnectProducer,
} from "@ratecreator/db/kafka-client";
import { getPrismaClient } from "@ratecreator/db/client";
import { getRedisClient } from "@ratecreator/db/redis-do";

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
  const C = 3.5; // Global average rating
  const m = 50; // Weight threshold
  const n = reviewCount;
  const sumRatings = currentAvgRating * reviewCount;
  return (C * m + sumRatings) / (m + n);
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
      include: {
        reviews: true,
      },
    });

    if (!account) {
      console.error(`Account ${accountId} for platform ${platform} not found`);
      return;
    }

    const reviewCount = account?.reviews.length || 0;
    const currentAvgRating = account?.rating || 0;
    const newAvgRating =
      reviewCount < 100
        ? simpleAverage(currentAvgRating, rating, reviewCount)
        : bayesianAverage(currentAvgRating, rating, reviewCount);

    await prisma.account.update({
      where: { id: account.id },
      data: {
        rating: newAvgRating,
        reviewCount: reviewCount,
      },
    });

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
          reviewCount: reviewCount,
        },
      };
      await redis.set(cacheKey, JSON.stringify(updatedData));

      console.log(
        `Updated db and redis for account ${accountId} of platform ${platform} with new rating ${newAvgRating}`
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
                  reviewCount: reviewCount,
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
