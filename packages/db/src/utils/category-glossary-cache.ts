import { Category, GlossaryCategory } from "@ratecreator/types/review";

interface CachedCategoriesData {
  data: { [key: string]: GlossaryCategory[] };
  timestamp: number;
}

interface CachedCategoryData {
  data: {
    category: Category;
    accounts: number;
  };
  timestamp: number;
}

const DB_NAME = "CategoryGlossaryCache";
const STORE_NAME = "categories";
// 7 days in milliseconds
const CACHE_EXPIRATION = 7 * 24 * 60 * 60 * 1000;
const MAX_CACHE_SIZE = 20 * 1024 * 1024; // 20MB limit

export class CategoryGlossaryCache {
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

  async getCachedCategories(): Promise<{
    [key: string]: GlossaryCategory[];
  } | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get("all-categories");

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const cachedData: CachedCategoriesData | undefined = request.result;
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

  async getCachedCategoryWithAccounts(
    slug: string
  ): Promise<{ category: Category; accounts: number } | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(`category-${slug}`);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const cachedData: CachedCategoryData | undefined = request.result;
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
          const cachedData = cursor.value;
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

  async setCachedCategories(data: { [key: string]: GlossaryCategory[] }) {
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
        id: "all-categories",
        data,
        timestamp: Date.now(),
      });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async setCachedCategoryWithAccounts(
    slug: string,
    data: { category: Category; accounts: number }
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
        id: `category-${slug}`,
        data,
        timestamp: Date.now(),
      });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

export const categoryGlossaryCache = new CategoryGlossaryCache();
