/**
 * @fileoverview Category glossary cache implementation for Rate Creator platform
 * @module utils/category-glossary-cache
 * @description Provides caching functionality for category and glossary data using IndexedDB.
 * Implements cache management, data retrieval, and automatic cache invalidation.
 */

import { Category, GlossaryCategory } from "@ratecreator/types/review";

/**
 * Interface for cached categories data
 * @interface
 */
interface CachedCategoriesData {
  data: { [key: string]: GlossaryCategory[] };
  timestamp: number;
}

/**
 * Interface for cached category data
 * @interface
 */
interface CachedCategoryData {
  data: {
    category: Category;
    accounts: number;
  };
  timestamp: number;
}

/**
 * Database name for the cache
 * @constant
 */
const DB_NAME = "CategoryGlossaryCache";

/**
 * Store name for the cache
 * @constant
 */
const STORE_NAME = "categories";

/**
 * Cache expiration time in milliseconds (7 days)
 * @constant
 */
const CACHE_EXPIRATION = 7 * 24 * 60 * 60 * 1000;

/**
 * Maximum cache size in bytes (20MB)
 * @constant
 */
const MAX_CACHE_SIZE = 20 * 1024 * 1024;

/**
 * Class for managing category and glossary data caching
 * @class
 */
export class CategoryGlossaryCache {
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
   * Retrieves cached categories data
   * @returns {Promise<{[key: string]: GlossaryCategory[]} | null>} Cached categories or null if expired/not found
   */
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

  /**
   * Retrieves cached category data with account count
   * @param {string} slug - Category slug
   * @returns {Promise<{category: Category; accounts: number} | null>} Cached category data or null if expired/not found
   */
  async getCachedCategoryWithAccounts(
    slug: string,
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
          const cachedData = cursor.value;
          if (now - cachedData.timestamp >= CACHE_EXPIRATION) {
            deletions.push(
              new Promise<void>((resolve, reject) => {
                const deleteRequest = store.delete(cursor.key);
                deleteRequest.onerror = () => reject(deleteRequest.error);
                deleteRequest.onsuccess = () => resolve();
              }),
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
   * Caches categories data
   * @param {{[key: string]: GlossaryCategory[]}} data - Categories data to cache
   * @returns {Promise<void>} Promise that resolves when caching is complete
   */
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

  /**
   * Caches category data with account count
   * @param {string} slug - Category slug
   * @param {{category: Category; accounts: number}} data - Category data to cache
   * @returns {Promise<void>} Promise that resolves when caching is complete
   */
  async setCachedCategoryWithAccounts(
    slug: string,
    data: { category: Category; accounts: number },
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

/**
 * Singleton instance of the category glossary cache
 */
export const categoryGlossaryCache = new CategoryGlossaryCache();
