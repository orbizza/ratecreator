/**
 * @fileoverview Creator cache implementation for Rate Creator platform
 * @module utils/creator-cache
 * @description Provides caching functionality for creator-related data using IndexedDB.
 * Implements cache management, data retrieval, and automatic cache invalidation.
 */

import { CreatorData } from "@ratecreator/types/review";

/**
 * Interface for cached creator data
 * @interface
 */
interface CachedCreatorData {
  data: CreatorData;
  timestamp: number;
}

/**
 * Database name for the cache
 * @constant
 */
const DB_NAME = "CreatorCache";

/**
 * Store name for the cache
 * @constant
 */
const STORE_NAME = "creators";

/**
 * Cache expiration time in milliseconds (5 minutes)
 * @constant
 */
const CACHE_EXPIRATION = 1000 * 60 * 5;

/**
 * Maximum cache size in bytes (50MB)
 * @constant
 */
const MAX_CACHE_SIZE = 50 * 1024 * 1024;

/**
 * Class for managing creator data caching
 * @class
 */
export class CreatorCache {
  private db: IDBDatabase | null = null;
  private currentSize: number = 0;

  /**
   * Initializes the IndexedDB database
   * @returns {Promise<void>} Promise that resolves when initialization is complete
   */
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

  /**
   * Generates a unique key for a creator
   * @param {string} platform - The platform name
   * @param {string} accountId - The account ID
   * @returns {string} Unique key for the creator
   * @private
   */
  private generateKey(platform: string, accountId: string): string {
    return `${platform}-${accountId}`;
  }

  /**
   * Retrieves cached creator data
   * @param {string} platform - The platform name
   * @param {string} accountId - The account ID
   * @returns {Promise<CreatorData | null>} Cached creator data or null if expired/not found
   */
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

  /**
   * Calculates the current size of the cache
   * @returns {Promise<number>} Current cache size in bytes
   * @private
   */
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

  /**
   * Cleans up expired cache entries
   * @returns {Promise<void>} Promise that resolves when cleanup is complete
   * @private
   */
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

  /**
   * Caches creator data
   * @param {string} platform - The platform name
   * @param {string} accountId - The account ID
   * @param {CreatorData} data - Creator data to cache
   * @returns {Promise<void>} Promise that resolves when caching is complete
   */
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

/**
 * Singleton instance of the creator cache
 */
export const creatorCache = new CreatorCache();
