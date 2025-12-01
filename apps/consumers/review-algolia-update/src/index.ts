import { getKafkaConsumer } from "@ratecreator/db/kafka-client";
import { getWriteClient } from "@ratecreator/db/algolia-client";

let consumer: ReturnType<typeof getKafkaConsumer>;

async function processMessage(message: any) {
  if (!message.value) {
    console.error("Invalid message: value is null");
    return;
  }

  const payload = JSON.parse(message.value.toString());
  console.log("Processing message with payload:", JSON.stringify(payload));

  const objectID = payload.objectID;
  const rating = payload.rating;
  const reviewCount = payload.reviewCount;

  if (!objectID || rating === undefined || reviewCount === undefined) {
    console.error("Invalid payload: missing required fields", {
      objectID,
      rating,
      reviewCount,
    });
    return;
  }

  const algoliaClient = getWriteClient();
  const BASE_INDEX_NAME = "accounts";

  // Retry logic for Algolia updates (handles transient failures)
  const maxRetries = 3;
  let retryCount = 0;
  let lastError: Error | null = null;

  while (retryCount < maxRetries) {
    try {
      // partialUpdateObject already waits for completion in the newer Algolia client
      await algoliaClient.partialUpdateObject({
        indexName: BASE_INDEX_NAME,
        objectID,
        attributesToUpdate: {
          rating,
          reviewCount,
        },
        createIfNotExists: false,
      });

      console.log(
        `✅ Successfully updated Algolia for account ${objectID} with rating ${rating} and reviewCount ${reviewCount}`,
      );
      return; // Success, exit retry loop
    } catch (error: any) {
      retryCount++;
      lastError = error instanceof Error ? error : new Error(String(error));

      // Log detailed error information
      const errorMessage =
        error?.message || error?.toString() || "Unknown error";
      const errorStatus = error?.status || error?.statusCode || "N/A";

      console.error(
        `❌ Algolia update failed (attempt ${retryCount}/${maxRetries}) for ${objectID}:`,
        {
          error: errorMessage,
          status: errorStatus,
          objectID,
          rating,
          reviewCount,
        },
      );

      // If it's a 404 (object not found), don't retry
      if (errorStatus === 404 || errorMessage.includes("not found")) {
        console.error(
          `⚠️ Object ${objectID} not found in Algolia index. Skipping retry.`,
        );
        return;
      }

      // If it's the last retry, throw the error
      if (retryCount >= maxRetries) {
        console.error(
          `❌ All retry attempts failed for ${objectID}. Last error:`,
          lastError,
        );
        throw lastError;
      }

      // Exponential backoff: wait 1s, 2s, 4s
      const backoffMs = Math.pow(2, retryCount - 1) * 1000;
      console.log(`⏳ Retrying in ${backoffMs}ms...`);
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }
  }

  // This should never be reached, but TypeScript needs it
  if (lastError) {
    throw lastError;
  }
}

async function startConsumer() {
  try {
    consumer = getKafkaConsumer("review-algolia-update-group");

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
      topic: "new-review-algolia-update",
      fromBeginning: true,
    });

    console.log("Consumer started and subscribed to new-review-algolia-update");

    await consumer.run({
      eachMessage: async ({ message }) => {
        try {
          console.log("Received message:", message?.value?.toString());
          await processMessage(message);
        } catch (error) {
          // Log error but don't crash the consumer
          // The error is already logged in processMessage with retry logic
          console.error(
            "Error in message handler (message will be retried by Kafka if needed):",
            error,
          );
          // Re-throw to let Kafka handle retry logic
          throw error;
        }
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
  console.log("Consumer connections closed");
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
  console.log("Starting review-algolia-update consumer service...");
  startConsumer().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}
