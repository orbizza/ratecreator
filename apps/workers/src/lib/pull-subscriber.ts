import type { Subscription } from "@google-cloud/pubsub";
import {
  getPubSubClient,
  PUBSUB_SUBSCRIPTIONS,
} from "@ratecreator/db/pubsub-client";

import { processUserSync } from "../processors/user-sync";
import { processDataFetch } from "../processors/data-fetch";
import { processTranslate } from "../processors/translate";
import { processCategoriseRoot } from "../processors/categorise-root";
import { processCategoriseSub } from "../processors/categorise-sub";
import { processElasticAccountSync } from "../processors/elastic-account-sync";
import { processReviewCalculate } from "../processors/review-calculate";
import { processReviewElasticUpdate } from "../processors/review-elastic-update";
import { processYoutubeRefresh } from "../processors/youtube-refresh";
import { processInstagramRefresh } from "../processors/instagram-refresh";
import { processRedditRefresh } from "../processors/reddit-refresh";
import { processTiktokRefresh } from "../processors/tiktok-refresh";

const SUBSCRIPTION_PROCESSORS: Record<
  string,
  (
    data: Record<string, unknown>,
    attributes: Record<string, string>,
  ) => Promise<void>
> = {
  [PUBSUB_SUBSCRIPTIONS.CLERK_USER_EVENTS]: processUserSync,
  [PUBSUB_SUBSCRIPTIONS.ACCOUNT_ADDED]: processDataFetch,
  [PUBSUB_SUBSCRIPTIONS.ACCOUNT_DATA_FETCHED]: processTranslate,
  [PUBSUB_SUBSCRIPTIONS.ACCOUNT_TRANSLATED]: processCategoriseRoot,
  [PUBSUB_SUBSCRIPTIONS.ACCOUNT_ROOT_CATEGORISED]: processCategoriseSub,
  [PUBSUB_SUBSCRIPTIONS.ACCOUNT_CATEGORISED_ELASTIC]: processElasticAccountSync,
  [PUBSUB_SUBSCRIPTIONS.NEW_REVIEW_CALCULATE]: processReviewCalculate,
  [PUBSUB_SUBSCRIPTIONS.NEW_REVIEW_ELASTIC_UPDATE]: processReviewElasticUpdate,
  [PUBSUB_SUBSCRIPTIONS.DATA_REFRESH_YOUTUBE]: processYoutubeRefresh,
  [PUBSUB_SUBSCRIPTIONS.DATA_REFRESH_INSTAGRAM]: processInstagramRefresh,
  [PUBSUB_SUBSCRIPTIONS.DATA_REFRESH_REDDIT]: processRedditRefresh,
  [PUBSUB_SUBSCRIPTIONS.DATA_REFRESH_TIKTOK]: processTiktokRefresh,
};

const MAX_DELIVERY_ATTEMPTS = 5;
const activeSubscriptions: Subscription[] = [];
const deliveryAttempts = new Map<string, number>();

export async function startPullSubscribers(): Promise<void> {
  const client = getPubSubClient();
  if (!client) {
    console.warn("[pull-subscriber] Pub/Sub not configured — skipping");
    return;
  }

  console.log("\n  Starting Pub/Sub Pull Subscribers...\n");

  for (const [subName, processor] of Object.entries(SUBSCRIPTION_PROCESSORS)) {
    try {
      const subscription = client.subscription(subName);
      const [subExists] = await subscription.exists();

      if (!subExists) {
        console.log(`    [skip] ${subName} — does not exist`);
        continue;
      }

      subscription.on("message", async (message) => {
        const messageId = message.id;
        const attempts = (deliveryAttempts.get(messageId) ?? 0) + 1;
        deliveryAttempts.set(messageId, attempts);

        if (attempts > MAX_DELIVERY_ATTEMPTS) {
          console.error(
            `  [pull] DEAD-LETTER ${subName} msg ${messageId} after ${attempts} attempts`,
          );
          deliveryAttempts.delete(messageId);
          message.ack();
          return;
        }

        try {
          const data = JSON.parse(message.data.toString("utf-8"));
          await processor(data, message.attributes);
          deliveryAttempts.delete(messageId);
          message.ack();
        } catch (err) {
          console.error(`  [pull] Failed ${subName} msg ${messageId}:`, err);
          message.nack();
        }
      });

      subscription.on("error", (err: Error & { code?: number }) => {
        // Code 9 = push subscription, can't pull — expected when subs are configured for push
        if (err.code === 9) return;
        console.error(`  [pull] Error on ${subName}:`, err.message);
      });

      activeSubscriptions.push(subscription);
      console.log(`    + ${subName} → listening`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`    [fail] ${subName} → ${msg}`);
    }
  }
}

export async function stopPullSubscribers(): Promise<void> {
  await Promise.all(activeSubscriptions.map((sub) => sub.close()));
  activeSubscriptions.length = 0;
  console.log("[pull-subscriber] All subscriptions closed");
}
