// /packages/clients/kafkaClient.ts
import { Kafka, Producer, Consumer } from "kafkajs";

let kafkaInstance: Kafka | null = null;

// ToDo: Enable SSL mode with SSL true and add CA Cert
export function getKafkaClient(): Kafka {
  if (!kafkaInstance) {
    kafkaInstance = new Kafka({
      clientId: "ratecreator-app",
      brokers: [
        process.env.KAFKA_SERVICE_URI ||
          "db-kafka-nyc3-91394-do-user-17726573-0.j.db.ondigitalocean.com:25073",
      ],
      ssl: false, // Set to true if SSL is required
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
