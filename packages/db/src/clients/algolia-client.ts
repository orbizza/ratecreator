import { algoliasearch, SearchClient } from "algoliasearch";

let searchClientInstance: SearchClient | null = null;
let writeClientInstance: SearchClient | null = null;

// const writeClient = algoliasearch(
//   process.env.ALGOLIA_APP_ID || "",
//   process.env.ALGOLIA_WRITE_API_KEY || ""
// );
// const readClient = algoliasearch(
//   process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || "",
//   process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY || ""
// );

// // Initialize indices with type-safe interfaces
// const listIndices = async () => await readClient.listIndices();

export const getSearchClient = (): SearchClient => {
  if (!searchClientInstance) {
    const algoliaClient = algoliasearch(
      process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!,
      process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY!
    );
    searchClientInstance = algoliaClient;
  }
  return searchClientInstance;
};

export const getWriteClient = () => {
  if (!writeClientInstance) {
    writeClientInstance = algoliasearch(
      process.env.ALGOLIA_APP_ID!,
      process.env.ALGOLIA_WRITE_API_KEY!
    );
  }
  return writeClientInstance;
};
