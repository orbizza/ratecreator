import { CreatorData } from "@ratecreator/types/review";

interface CachedCreatorData {
  data: CreatorData;
  timestamp: number;
}

const DB_NAME = "CreatorCache";
const STORE_NAME = "creators";
const CACHE_EXPIRATION = 1000 * 60 * 5; // Reduced to 5 minutes
const MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB limit

export class CreatorCache {
  private db: IDBDatabase | null = null;
  private currentSize: number = 0;

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

  private async calculateSize(): Promise<number> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const totalSize = request.result.reduce((size, item) => {
          return size + new Blob([JSON.stringify(item)]).size;
        }, 0);
        this.currentSize = totalSize;
        resolve(totalSize);
      };
    });
  }

  private async cleanup() {
    if (!this.db) await this.init();

    return new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.openCursor();

      const deletions: Promise<void>[] = [];
      const now = Date.now();

      request.onerror = () => reject(request.error);
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const cachedData: CachedCreatorData = cursor.value;
          if (now - cachedData.timestamp >= CACHE_EXPIRATION) {
            deletions.push(
              new Promise<void>((resolve, reject) => {
                const deleteRequest = store.delete(cursor.key);
                deleteRequest.onerror = () => reject(deleteRequest.error);
                deleteRequest.onsuccess = () => resolve();
              })
            );
          }
          cursor.continue();
        } else {
          Promise.all(deletions)
            .then(() => resolve())
            .catch(reject);
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

    const newEntrySize = new Blob([JSON.stringify(data)]).size;
    const currentSize = await this.calculateSize();

    if (currentSize + newEntrySize > MAX_CACHE_SIZE) {
      await this.cleanup();
    }

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
