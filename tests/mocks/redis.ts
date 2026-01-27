/**
 * Redis Mock
 * Provides an in-memory Redis mock for testing
 */

import { vi } from "vitest";

// In-memory store for mock Redis data
const store: Map<string, string> = new Map();
const expiries: Map<string, number> = new Map();

// Mock Redis Client
export const mockRedisClient = {
  // Connection
  connect: vi.fn().mockResolvedValue("OK"),
  disconnect: vi.fn().mockResolvedValue("OK"),
  quit: vi.fn().mockResolvedValue("OK"),
  ping: vi.fn().mockResolvedValue("PONG"),

  // String operations
  get: vi.fn((key: string) => Promise.resolve(store.get(key) || null)),
  set: vi.fn((key: string, value: string) => {
    store.set(key, value);
    return Promise.resolve("OK");
  }),
  setex: vi.fn((key: string, seconds: number, value: string) => {
    store.set(key, value);
    expiries.set(key, Date.now() + seconds * 1000);
    return Promise.resolve("OK");
  }),
  setnx: vi.fn((key: string, value: string) => {
    if (!store.has(key)) {
      store.set(key, value);
      return Promise.resolve(1);
    }
    return Promise.resolve(0);
  }),
  mget: vi.fn((...keys: string[]) =>
    Promise.resolve(keys.map((key) => store.get(key) || null))
  ),
  mset: vi.fn((...args: string[]) => {
    for (let i = 0; i < args.length; i += 2) {
      store.set(args[i], args[i + 1]);
    }
    return Promise.resolve("OK");
  }),
  incr: vi.fn((key: string) => {
    const current = parseInt(store.get(key) || "0", 10);
    const newValue = (current + 1).toString();
    store.set(key, newValue);
    return Promise.resolve(current + 1);
  }),
  decr: vi.fn((key: string) => {
    const current = parseInt(store.get(key) || "0", 10);
    const newValue = (current - 1).toString();
    store.set(key, newValue);
    return Promise.resolve(current - 1);
  }),
  incrby: vi.fn((key: string, increment: number) => {
    const current = parseInt(store.get(key) || "0", 10);
    const newValue = (current + increment).toString();
    store.set(key, newValue);
    return Promise.resolve(current + increment);
  }),

  // Key operations
  del: vi.fn((...keys: string[]) => {
    let deleted = 0;
    keys.forEach((key) => {
      if (store.delete(key)) deleted++;
      expiries.delete(key);
    });
    return Promise.resolve(deleted);
  }),
  exists: vi.fn((...keys: string[]) => {
    let count = 0;
    keys.forEach((key) => {
      if (store.has(key)) count++;
    });
    return Promise.resolve(count);
  }),
  expire: vi.fn((key: string, seconds: number) => {
    if (store.has(key)) {
      expiries.set(key, Date.now() + seconds * 1000);
      return Promise.resolve(1);
    }
    return Promise.resolve(0);
  }),
  ttl: vi.fn((key: string) => {
    const expiry = expiries.get(key);
    if (!expiry) return Promise.resolve(-1);
    const remaining = Math.ceil((expiry - Date.now()) / 1000);
    return Promise.resolve(remaining > 0 ? remaining : -2);
  }),
  keys: vi.fn((pattern: string) => {
    const regex = new RegExp(pattern.replace(/\*/g, ".*"));
    const matchingKeys = Array.from(store.keys()).filter((key) => regex.test(key));
    return Promise.resolve(matchingKeys);
  }),

  // Hash operations
  hget: vi.fn((key: string, field: string) => {
    const hash = store.get(key);
    if (!hash) return Promise.resolve(null);
    try {
      const parsed = JSON.parse(hash);
      return Promise.resolve(parsed[field] || null);
    } catch {
      return Promise.resolve(null);
    }
  }),
  hset: vi.fn((key: string, field: string, value: string) => {
    let hash: Record<string, string> = {};
    const existing = store.get(key);
    if (existing) {
      try {
        hash = JSON.parse(existing);
      } catch {
        /* ignore */
      }
    }
    hash[field] = value;
    store.set(key, JSON.stringify(hash));
    return Promise.resolve(1);
  }),
  hgetall: vi.fn((key: string) => {
    const hash = store.get(key);
    if (!hash) return Promise.resolve(null);
    try {
      return Promise.resolve(JSON.parse(hash));
    } catch {
      return Promise.resolve(null);
    }
  }),
  hdel: vi.fn((key: string, ...fields: string[]) => {
    const hash = store.get(key);
    if (!hash) return Promise.resolve(0);
    try {
      const parsed = JSON.parse(hash);
      let deleted = 0;
      fields.forEach((field) => {
        if (parsed[field] !== undefined) {
          delete parsed[field];
          deleted++;
        }
      });
      store.set(key, JSON.stringify(parsed));
      return Promise.resolve(deleted);
    } catch {
      return Promise.resolve(0);
    }
  }),

  // List operations
  lpush: vi.fn((key: string, ...values: string[]) => {
    const list = JSON.parse(store.get(key) || "[]");
    list.unshift(...values.reverse());
    store.set(key, JSON.stringify(list));
    return Promise.resolve(list.length);
  }),
  rpush: vi.fn((key: string, ...values: string[]) => {
    const list = JSON.parse(store.get(key) || "[]");
    list.push(...values);
    store.set(key, JSON.stringify(list));
    return Promise.resolve(list.length);
  }),
  lpop: vi.fn((key: string) => {
    const list = JSON.parse(store.get(key) || "[]");
    const value = list.shift();
    store.set(key, JSON.stringify(list));
    return Promise.resolve(value || null);
  }),
  rpop: vi.fn((key: string) => {
    const list = JSON.parse(store.get(key) || "[]");
    const value = list.pop();
    store.set(key, JSON.stringify(list));
    return Promise.resolve(value || null);
  }),
  lrange: vi.fn((key: string, start: number, stop: number) => {
    const list = JSON.parse(store.get(key) || "[]");
    const end = stop === -1 ? list.length : stop + 1;
    return Promise.resolve(list.slice(start, end));
  }),
  llen: vi.fn((key: string) => {
    const list = JSON.parse(store.get(key) || "[]");
    return Promise.resolve(list.length);
  }),

  // Set operations
  sadd: vi.fn((key: string, ...members: string[]) => {
    const set = new Set(JSON.parse(store.get(key) || "[]"));
    let added = 0;
    members.forEach((member) => {
      if (!set.has(member)) {
        set.add(member);
        added++;
      }
    });
    store.set(key, JSON.stringify(Array.from(set)));
    return Promise.resolve(added);
  }),
  smembers: vi.fn((key: string) => {
    return Promise.resolve(JSON.parse(store.get(key) || "[]"));
  }),
  sismember: vi.fn((key: string, member: string) => {
    const set = new Set(JSON.parse(store.get(key) || "[]"));
    return Promise.resolve(set.has(member) ? 1 : 0);
  }),
  srem: vi.fn((key: string, ...members: string[]) => {
    const set = new Set<string>(JSON.parse(store.get(key) || "[]"));
    let removed = 0;
    members.forEach((member) => {
      if (set.delete(member)) removed++;
    });
    store.set(key, JSON.stringify(Array.from(set)));
    return Promise.resolve(removed);
  }),

  // Status
  status: "ready",
};

// Helper to clear all mock data
export const clearRedisMock = () => {
  store.clear();
  expiries.clear();
};

// Helper to seed mock data
export const seedRedisMock = (data: Record<string, string>) => {
  Object.entries(data).forEach(([key, value]) => {
    store.set(key, value);
  });
};

// Helper to get all current data (for assertions)
export const getRedisMockData = () => {
  return Object.fromEntries(store);
};

// Reset all Redis mocks
export const resetRedisMocks = () => {
  clearRedisMock();
  Object.values(mockRedisClient).forEach((method) => {
    if (typeof method === "function" && "mockClear" in method) {
      (method as ReturnType<typeof vi.fn>).mockClear();
    }
  });
};

export default mockRedisClient;
