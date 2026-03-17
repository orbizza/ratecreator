interface PubSubPushMessage {
  message: {
    data: string;
    messageId: string;
    publishTime: string;
    attributes?: Record<string, string>;
  };
  subscription: string;
}

function isPubSubEnvelope(body: unknown): body is PubSubPushMessage {
  return (
    typeof body === "object" &&
    body !== null &&
    "message" in body &&
    typeof (body as PubSubPushMessage).message?.data === "string"
  );
}

export function parsePubSubMessage<T>(body: unknown): T {
  if (isPubSubEnvelope(body)) {
    const decoded = Buffer.from(body.message.data, "base64").toString("utf-8");
    return JSON.parse(decoded) as T;
  }
  return body as T;
}

export function getMessageId(body: unknown): string {
  if (isPubSubEnvelope(body) && body.message.messageId) {
    return body.message.messageId;
  }
  return `local-${Date.now()}`;
}

export function getMessageAttributes(body: unknown): Record<string, string> {
  if (isPubSubEnvelope(body) && body.message.attributes) {
    return body.message.attributes;
  }
  return {};
}
