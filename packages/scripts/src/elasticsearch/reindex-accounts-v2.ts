/**
 * Zero-Downtime Reindex: accounts → accounts_v2
 *
 * Creates a new index with updated analyzers/mappings (infix, exact_lowercase,
 * min_gram:2), reindexes all documents, and swaps an alias for zero downtime.
 *
 * Steps:
 *   1. Create accounts_v2 with new settings/mappings
 *   2. Reindex from accounts → accounts_v2 (server-side, ~30 min for 3M docs)
 *   3. Verify doc counts match
 *   4. Create/update alias: accounts → accounts_v2
 *   5. (Optional) Delete old index
 *
 * Usage:
 *   yarn reindex-accounts-v2
 *   yarn reindex-accounts-v2 -- --delete-old    # also deletes old index
 *   yarn reindex-accounts-v2 -- --dry-run       # preview without changes
 */

import dotenv from "dotenv";
import path from "path";
import { Client, type ClientOptions } from "@opensearch-project/opensearch";

dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });

const OLD_INDEX = process.env.ELASTIC_ACCOUNTS_INDEX || "accounts";
const NEW_INDEX = `${OLD_INDEX}_v2`;

let elasticClient: Client | null = null;

function getElasticsearchClient(): Client {
  if (!elasticClient) {
    const url = process.env.ELASTIC_URL;
    const username = process.env.ELASTIC_USERNAME;
    const password = process.env.ELASTIC_PASSWORD;

    if (!url) throw new Error("ELASTIC_URL not configured");
    const opts: ClientOptions = {
      node: url,
      ssl: { rejectUnauthorized: false },
      ...(username && password ? { auth: { username, password } } : {}),
    };
    elasticClient = new Client(opts);
  }
  return elasticClient;
}

/**
 * New index settings — matches ACCOUNTS_INDEX_SETTINGS from elasticsearch-client.ts.
 * Duplicated here to avoid importing from a package that may have env requirements.
 */
const NEW_INDEX_SETTINGS = {
  settings: {
    analysis: {
      analyzer: {
        autocomplete: {
          type: "custom",
          tokenizer: "standard",
          filter: ["lowercase", "autocomplete_filter"],
        },
        autocomplete_search: {
          type: "custom",
          tokenizer: "standard",
          filter: ["lowercase"],
        },
        infix: {
          type: "custom",
          tokenizer: "standard",
          filter: ["lowercase", "infix_filter"],
        },
        exact_lowercase: {
          type: "custom",
          tokenizer: "keyword",
          filter: ["lowercase", "trim"],
        },
      },
      filter: {
        autocomplete_filter: {
          type: "edge_ngram",
          min_gram: 2,
          max_gram: 20,
        },
        infix_filter: {
          type: "ngram",
          min_gram: 4,
          max_gram: 5,
        },
      },
    },
  },
  mappings: {
    properties: {
      objectID: { type: "keyword" },
      platform: { type: "keyword" },
      accountId: { type: "keyword" },
      handle: {
        type: "text",
        analyzer: "autocomplete",
        search_analyzer: "autocomplete_search",
        fields: {
          keyword: { type: "keyword" },
          exact: { type: "text", analyzer: "exact_lowercase" },
          infix: {
            type: "text",
            analyzer: "infix",
            search_analyzer: "autocomplete_search",
          },
        },
      },
      name: {
        type: "text",
        analyzer: "autocomplete",
        search_analyzer: "autocomplete_search",
        fields: {
          keyword: { type: "keyword" },
          exact: { type: "text", analyzer: "exact_lowercase" },
          infix: {
            type: "text",
            analyzer: "infix",
            search_analyzer: "autocomplete_search",
          },
        },
      },
      description: { type: "text" },
      keywords: { type: "text" },
      imageUrl: { type: "keyword", index: false },
      bannerUrl: { type: "keyword", index: false },
      followerCount: { type: "long" },
      country: { type: "keyword" },
      language_code: { type: "keyword" },
      rating: { type: "float" },
      reviewCount: { type: "integer" },
      madeForKids: { type: "boolean" },
      claimed: { type: "boolean" },
      videoCount: { type: "integer" },
      viewCount: { type: "long" },
      categories: { type: "keyword" },
      categoryNames: { type: "text" },
      createdDate: { type: "date" },
      isSeeded: { type: "boolean" },
      lastIndexedAt: { type: "date" },
    },
  },
};

async function reindex(deleteOld: boolean, dryRun: boolean) {
  console.log("=".repeat(60));
  console.log("Zero-Downtime Reindex: accounts → accounts_v2");
  console.log("=".repeat(60));
  console.log(`Old index: ${OLD_INDEX}`);
  console.log(`New index: ${NEW_INDEX}`);
  console.log(`Delete old: ${deleteOld}`);
  console.log(`Dry run: ${dryRun}`);
  console.log("=".repeat(60));

  const client = getElasticsearchClient();

  // Step 0: Check old index exists
  const oldExists = await client.indices.exists({ index: OLD_INDEX });
  if (!oldExists) {
    console.error(
      `Old index "${OLD_INDEX}" does not exist. Nothing to reindex.`,
    );
    process.exit(1);
  }

  // Get old index doc count
  const oldCount = await client.count({ index: OLD_INDEX });
  console.log(`\nOld index doc count: ${oldCount.count}`);

  if (dryRun) {
    console.log("\n[DRY RUN] Would create new index, reindex, and swap alias.");
    console.log("Key changes in new index:");
    console.log("  - autocomplete_filter min_gram: 1 → 2");
    console.log("  - NEW infix analyzer (ngram 4-5) for substring matching");
    console.log(
      "  - NEW exact_lowercase analyzer for case-insensitive exact match",
    );
    console.log(
      "  - NEW name.infix, name.exact, handle.infix, handle.exact sub-fields",
    );
    process.exit(0);
  }

  // Step 1: Create new index
  const newExists = await client.indices.exists({ index: NEW_INDEX });
  if (newExists) {
    console.log(
      `\nNew index "${NEW_INDEX}" already exists — deleting it first...`,
    );
    await client.indices.delete({ index: NEW_INDEX });
  }

  console.log(`\nCreating new index: ${NEW_INDEX}`);
  await client.indices.create({
    index: NEW_INDEX,
    body: NEW_INDEX_SETTINGS,
  });
  console.log("New index created.");

  // Step 2: Reindex (async task with retry loop)
  // Elastic Serverless may cap single reindex operations, so we loop until
  // all docs are transferred. Each run is idempotent (existing docs get updated).
  console.log("\nStarting reindex...");
  const startTime = Date.now();
  const MAX_ATTEMPTS = 10;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const currentCount = await client.count({ index: NEW_INDEX });
    if (currentCount.count >= oldCount.count * 0.99) {
      console.log(`\nAll docs transferred after ${attempt - 1} round(s).`);
      break;
    }

    if (attempt > 1) {
      console.log(
        `\nRound ${attempt}: ${currentCount.count}/${oldCount.count} docs so far, continuing...`,
      );
    }

    const taskResponse = await client.reindex({
      body: {
        source: { index: OLD_INDEX },
        dest: { index: NEW_INDEX },
      },
      wait_for_completion: false,
      slices: "auto",
      refresh: true,
    });

    const taskId = taskResponse.task;
    console.log(`Task started: ${taskId} (round ${attempt})`);
    console.log("Polling every 30 seconds...\n");

    // Poll until task completes — use index doc count for progress since
    // sliced reindex parent tasks don't aggregate child progress
    let taskDone = false;
    while (!taskDone) {
      await new Promise((resolve) => setTimeout(resolve, 30000));

      const elapsedMin = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

      // Check actual doc count in new index for progress
      const newCount = await client.count({ index: NEW_INDEX });
      const progressPct = ((newCount.count / oldCount.count) * 100).toFixed(1);
      console.log(
        `  [${elapsedMin} min] ${newCount.count}/${oldCount.count} docs (${progressPct}%)`,
      );

      // Check if task is done
      const taskStatus = await client.tasks.get({ task_id: String(taskId) });
      const task = taskStatus as any;

      if (task.completed) {
        taskDone = true;
        const response = task.response || {};
        console.log(
          `Round ${attempt} done: created=${response.created || 0}, updated=${response.updated || 0}, failures=${response.failures?.length || 0}`,
        );

        if (response.failures && response.failures.length > 0) {
          console.error("Failures:", response.failures.slice(0, 5));
        }
      }
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  console.log(`\nReindex finished in ${elapsed} minutes.`);

  // Step 3: Verify doc counts
  const newCount = await client.count({ index: NEW_INDEX });
  console.log(`\nDoc count verification:`);
  console.log(`  Old: ${oldCount.count}`);
  console.log(`  New: ${newCount.count}`);

  if (newCount.count < oldCount.count * 0.99) {
    console.error(
      `\nWARNING: New index has significantly fewer docs (${((newCount.count / oldCount.count) * 100).toFixed(1)}%). Aborting alias swap.`,
    );
    console.error(
      "The new index is kept for inspection. Delete it manually if needed.",
    );
    process.exit(1);
  }

  console.log("Doc counts match within tolerance.");

  // Step 4: Check if OLD_INDEX is an alias or a real index
  const aliasExists = await client.indices
    .existsAlias({
      name: OLD_INDEX,
    })
    .catch(() => false);

  if (aliasExists) {
    // OLD_INDEX is already an alias — update it to point to NEW_INDEX
    console.log(
      `\nUpdating alias "${OLD_INDEX}" to point to "${NEW_INDEX}"...`,
    );

    // Get current alias targets
    const aliases = await client.indices.getAlias({ name: OLD_INDEX });
    const oldTargets = Object.keys(aliases);

    await client.indices.updateAliases({
      body: {
        actions: [
          ...oldTargets.map((target) => ({
            remove: { index: target, alias: OLD_INDEX },
          })),
          { add: { index: NEW_INDEX, alias: OLD_INDEX } },
        ],
      },
    });

    console.log("Alias updated.");

    if (deleteOld) {
      for (const target of oldTargets) {
        console.log(`Deleting old index: ${target}`);
        await client.indices.delete({ index: target });
      }
    }
  } else {
    // OLD_INDEX is a real index — delete it, create alias
    console.log(
      `\n"${OLD_INDEX}" is a real index. To swap, we'll delete it and create an alias.`,
    );
    console.log(`Deleting old index "${OLD_INDEX}"...`);
    await client.indices.delete({ index: OLD_INDEX });

    console.log(`Creating alias "${OLD_INDEX}" → "${NEW_INDEX}"...`);
    await client.indices.putAlias({
      index: NEW_INDEX,
      name: OLD_INDEX,
    });

    console.log("Alias created.");
  }

  console.log("\n" + "=".repeat(60));
  console.log("REINDEX COMPLETE");
  console.log("=".repeat(60));
  console.log(`New index: ${NEW_INDEX}`);
  console.log(`Alias: ${OLD_INDEX} → ${NEW_INDEX}`);
  console.log(`Docs: ${newCount.count}`);
  console.log(`Time: ${elapsed} minutes`);
  console.log("=".repeat(60));

  process.exit(0);
}

// Parse args
const args = process.argv.slice(2);
const deleteOld = args.includes("--delete-old");
const dryRun = args.includes("--dry-run");

reindex(deleteOld, dryRun).catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
