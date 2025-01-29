import { getKafkaConsumer } from "@ratecreator/db/kafka-client";
import { getPrismaClient } from "@ratecreator/db/client";

const prisma = getPrismaClient();
let consumer: ReturnType<typeof getKafkaConsumer>;

async function processMessage(message: any) {
  if (!message.value || !message.key) {
    console.error("Invalid message: value or key is null");
    return;
  }

  const payload = JSON.parse(message.value.toString());
  console.log("Processing message with payload:", JSON.stringify(payload));
  const [eventType] = message.key.toString().split(":");

  try {
    if (eventType === "user.created") {
      const email = payload.email_addresses[0].email_address;
      await prisma.user.upsert({
        where: { email },
        create: {
          clerkId: payload.id,
          email,
          firstName: payload.first_name || "",
          lastName: payload.last_name || "",
          username: payload.username || "",
          webhookPayload: payload,
          isDeleted: false,
          deletedAt: null,
        },
        update: {
          clerkId: payload.id,
          firstName: payload.first_name || "",
          lastName: payload.last_name || "",
          username: payload.username || "",
          webhookPayload: payload,
          isDeleted: false,
          deletedAt: null,
        },
      });
      console.log(`Upserted user with email ${email}`);
    } else if (eventType === "user.updated") {
      await prisma.user.update({
        where: { clerkId: payload.id },
        data: {
          email: payload.email_addresses[0].email_address,
          firstName: payload.first_name,
          lastName: payload.last_name,
          username: payload.username,
          webhookPayload: payload,
        },
      });
      console.log(`Updated user: ${payload.id}`);
    } else if (eventType === "user.deleted") {
      try {
        // First try to find the user
        const user = await prisma.user.findUnique({
          where: { clerkId: payload.id },
        });

        if (!user) {
          console.log(
            `User ${payload.id} not found in database for deletion. Skipping.`
          );
          return;
        }

        await prisma.user.update({
          where: { clerkId: payload.id },
          data: {
            isDeleted: true,
            deletedAt: new Date(),
            // webhookPayload: payload,
          },
        });
        console.log(`Marked user as deleted: ${payload.id}`);
      } catch (error) {
        console.error(`Error processing delete for user ${payload.id}:`, error);
      }
    } else {
      console.log(`Unhandled event type: ${eventType}`);
    }
  } catch (error) {
    console.error(`Error processing message for user ${payload.id}:`, error);
  }
}

async function startConsumer() {
  try {
    consumer = getKafkaConsumer("clerk-group");
    await consumer.connect();
    await consumer.subscribe({
      topic: "clerk-user-events",
      fromBeginning: true,
    });

    console.log("Consumer started and subscribed to clerk-user-events");

    await consumer.run({
      eachMessage: async ({ message }) => {
        await processMessage(message);
      },
    });
  } catch (error) {
    console.error("Failed to start consumer:", error);
    process.exit(1);
  }
}

async function stopConsumer() {
  if (consumer) {
    await consumer.disconnect();
  }
  await prisma.$disconnect();
  console.log("Consumer and database connections closed");
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
  console.log("Starting user sync consumer service...");
  startConsumer().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}
