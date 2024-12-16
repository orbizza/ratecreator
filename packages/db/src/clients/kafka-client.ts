import { Kafka, Producer, Consumer, Admin } from "kafkajs";
import "../utils/loadEnv";

let kafkaInstance: Kafka | null = null;

export function getKafkaClient(): Kafka {
  if (!kafkaInstance) {
    kafkaInstance = new Kafka({
      clientId: "ratecreator-app",
      brokers: [
        process.env.KAFKA_SERVICE_URI ||
          "db-kafka-nyc3-91394-do-user-17726573-0.j.db.ondigitalocean.com:25073",
      ],
      ssl: {
        rejectUnauthorized: false,
        ca: [process.env.KAFKA_CA_CERT || ""],
      },
      sasl:
        process.env.KAFKA_USERNAME && process.env.KAFKA_PASSWORD
          ? {
              mechanism: "plain",
              username: process.env.KAFKA_USERNAME,
              password: process.env.KAFKA_PASSWORD,
            }
          : undefined,
    });
  }
  return kafkaInstance;
}

export function getKafkaProducer(): Producer {
  return getKafkaClient().producer();
}

export function getKafkaConsumer(groupId: string): Consumer {
  return getKafkaClient().consumer({ groupId });
}

export async function createTopicIfNotExists(topicName: string) {
  const kafka = getKafkaClient();
  const admin: Admin = kafka.admin();
  await admin.connect();

  const topics = await admin.listTopics();
  if (!topics.includes(topicName)) {
    await admin.createTopics({
      topics: [{ topic: topicName }],
    });
    console.log(`Topic ${topicName} created.`);
  } else {
    console.log(`Topic ${topicName} already exists.`);
  }

  await admin.disconnect();
}
