require("dotenv").config();

import { getWriteClient } from "@ratecreator/db/algolia-client";
import { getMongoClient } from "@ratecreator/db/mongo-client";
import pLimit from "p-limit";
import { ObjectId } from "mongodb";

const client = getWriteClient();
const limit = pLimit(20); // Adjust concurrency limit as needed

const updateAlgoliaRecords = async () => {
  try {
    const mongo_client = await getMongoClient();
    const db = mongo_client.db("ratecreator");
    // Fetch all existing indexed records from Algolia
    const { hits } = await client.searchSingleIndex({
      indexName: "accounts",
      searchParams: {
        query: "", // Fetch all records
        hitsPerPage: 1, // Adjust to batch size as needed
      },
    });

    if (hits.length === 0) {
      console.log("No records found in the index.");
      return;
    }

    const promises = hits.map(async (hit) => {
      try {
        // Fetch the corresponding account data from MongoDB
        const account = await db.collection("Account").findOne({
          _id: new ObjectId(hit.objectID),
        });

        if (!account) {
          console.log(`No account found for objectID ${hit.objectID}`);
          return;
        }

        // Extract the createdDate from ytData -> snippet -> publishedAt
        const createdDate = account.ytData?.snippet?.publishedAt ?? null;

        // Update the existing record in Algolia to include the new createdDate field
        await limit(() =>
          client.partialUpdateObject({
            objectID: hit.objectID,
            indexName: "accounts",
            attributesToUpdate: { createdDate: createdDate }, // Add or update the createdDate field
          }),
        );

        console.log(`Updated record with objectID ${hit.objectID}`);
      } catch (error) {
        console.error(
          `Error updating record with objectID ${hit.objectID}:`,
          error,
        );
      }
    });

    const responses = await Promise.all(promises);
    console.log(`Updated ${responses.length} records with createdDate.`);
  } catch (error) {
    console.error("Error updating records in Algolia:", error);
  } finally {
    process.exit(0);
  }
};

updateAlgoliaRecords();
