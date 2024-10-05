import { SearchResult } from "@ratecreator/types/review";

interface CachedSearchResult {
  query: string;
  results: SearchResult[];
  timestamp: number;
}

const DB_NAME = "SearchCache";
const STORE_NAME = "results";
const CACHE_EXPIRATION = 1000 * 60 * 60 * 24; // 24 hour

export class SearchCache {
  private db: IDBDatabase | null = null;

  async init() {
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        db.createObjectStore(STORE_NAME, { keyPath: "query" });
      };
    });
  }

  async getCachedResults(query: string): Promise<SearchResult[] | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(query);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const cachedData: CachedSearchResult | undefined = request.result;
        if (
          cachedData &&
          Date.now() - cachedData.timestamp < CACHE_EXPIRATION
        ) {
          resolve(cachedData.results);
        } else {
          resolve(null);
        }
      };
    });
  }

  async setCachedResults(query: string, results: SearchResult[]) {
    if (!this.db) await this.init();

    return new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put({
        query,
        results,
        timestamp: Date.now(),
      });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

export const searchCache = new SearchCache();
