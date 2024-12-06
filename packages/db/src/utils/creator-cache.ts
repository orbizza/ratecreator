import { CreatorData } from "@ratecreator/types/review";

interface CachedCreatorData {
  data: CreatorData;
  timestamp: number;
}

const DB_NAME = "CreatorCache";
const STORE_NAME = "creators";
const CACHE_EXPIRATION = 1000 * 60 * 60 * 24; // 24 hours

export class CreatorCache {
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
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      };
    });
  }

  private generateKey(platform: string, accountId: string): string {
    return `${platform}-${accountId}`;
  }

  async getCachedCreator(
    platform: string,
    accountId: string
  ): Promise<CreatorData | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(this.generateKey(platform, accountId));

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const cachedData: CachedCreatorData | undefined = request.result;
        if (
          cachedData &&
          Date.now() - cachedData.timestamp < CACHE_EXPIRATION
        ) {
          resolve(cachedData.data);
        } else {
          resolve(null);
        }
      };
    });
  }

  async setCachedCreator(
    platform: string,
    accountId: string,
    data: CreatorData
  ) {
    if (!this.db) await this.init();

    return new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put({
        id: this.generateKey(platform, accountId),
        data,
        timestamp: Date.now(),
      });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

export const creatorCache = new CreatorCache();
