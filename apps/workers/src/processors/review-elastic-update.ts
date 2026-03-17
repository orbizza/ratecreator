import { updateAccount } from "@ratecreator/db/elasticsearch-client";

export async function processReviewElasticUpdate(
  data: Record<string, unknown>,
  attributes: Record<string, string>,
): Promise<void> {
  const { objectID, rating, reviewCount } = data as {
    objectID: string;
    rating: number;
    reviewCount: number;
  };

  if (!objectID || rating === undefined || reviewCount === undefined) {
    console.error("Invalid payload: missing required fields", {
      objectID,
      rating,
      reviewCount,
    });
    return;
  }

  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      await updateAccount(objectID, { rating, reviewCount });
      console.log(
        `Updated Elasticsearch for account ${objectID} with rating ${rating} and reviewCount ${reviewCount}`,
      );
      return;
    } catch (error: any) {
      retryCount++;
      const errorMessage = error?.message || String(error);
      console.error(
        `Elasticsearch update failed (attempt ${retryCount}/${maxRetries}) for ${objectID}:`,
        errorMessage,
      );

      if (error?.meta?.statusCode === 404) {
        console.error(
          `Object ${objectID} not found in Elasticsearch index. Skipping.`,
        );
        return;
      }

      if (retryCount >= maxRetries) {
        console.error(`All retry attempts failed for ${objectID}`);
        throw error;
      }

      const backoffMs = Math.pow(2, retryCount - 1) * 1000;
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }
  }
}
