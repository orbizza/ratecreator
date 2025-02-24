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

  try {
    const objectID = payload.objectID;
    const rating = payload.rating;
    const reviewCount = payload.reviewCount;

    const algoliaClient = getWriteClient();
    const BASE_INDEX_NAME = "accounts";

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
      `Updated algolia for account ${objectID} with rating ${rating} and reviewCount ${reviewCount}`,
    );
  } catch (error) {
    console.error(
      `Error processing message for rating in ${payload.objectID}:`,
      error,
    );
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
  console.log("Starting review-calculate consumer service...");
  startConsumer().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}
