"use server";

import axios from "axios";

import { Category } from "@ratecreator/types/review";
import { getRedisClient } from "@ratecreator/db/redis-do";
import { getPrismaClient } from "@ratecreator/db/client";
const CACHE_ROOT_CATEGORIES = "category-root";
const CACHE_ALL_CATEGORIES = "category-all";

export async function getCategoryData(): Promise<Category[]> {
  const redis = getRedisClient();
  const prisma = getPrismaClient();
  const CACHE_EXPIRY = 60 * 60 * 24; // 24 hours in seconds

  try {
    // const response = await axios.get(
    //   `${process.env.NEXT_PUBLIC_RATECREATOR_API_URL}/api/categories?type=root`
    // );
    // return response.data;
    const cachedCategories = await redis.get(CACHE_ROOT_CATEGORIES);
    if (cachedCategories) {
      console.log("Returning cached root categories");
      return JSON.parse(cachedCategories);
    }

    const allCategories = await prisma.category.findMany({
      orderBy: { depth: "asc" },
    });

    const categoryMap: { [key: string]: Category } = {};
    allCategories.forEach((category) => {
      categoryMap[category.id] = { ...category, subcategories: [] };
    });

    const rootCategories: Category[] = [];
    allCategories.forEach((category) => {
      if (category.parentId) {
        const parentCategory = categoryMap[category.parentId];
        if (parentCategory) {
          parentCategory.subcategories?.push(categoryMap[category.id]);
        }
      } else {
        rootCategories.push(categoryMap[category.id]);
      }
    });

    await redis.set(
      CACHE_ALL_CATEGORIES,
      JSON.stringify(allCategories),
      "EX",
      CACHE_EXPIRY,
    );
    console.log("All Categories cached in Redis for 24 hours");

    await redis.set(
      CACHE_ROOT_CATEGORIES,
      JSON.stringify(rootCategories),
      "EX",
      CACHE_EXPIRY,
    );
    console.log("Root Categories cached in Redis for 24 hours");

    return rootCategories;
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    throw new Error("Failed to fetch categories");
  }
}

export async function getAllCategoriesAlphabetically(): Promise<{
  [key: string]: Category[];
}> {
  const redis = getRedisClient();
  const prisma = getPrismaClient();
  const CACHE_ALPHABETICAL_CATEGORIES = "category-alphabetical";
  const CACHE_EXPIRY = 60 * 60 * 24; // 24 hours in seconds

  try {
    // Check cache first
    const cachedCategories = await redis.get(CACHE_ALPHABETICAL_CATEGORIES);
    if (cachedCategories) {
      console.log("Returning cached alphabetical categories");
      return JSON.parse(cachedCategories);
    }

    // Fetch all categories from database
    const allCategories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      where: {
        deletedAt: null,
      },
    });

    // Group categories by first letter
    const categoriesByLetter: { [key: string]: Category[] } = {};

    allCategories.forEach((category) => {
      const firstLetter = category.name.charAt(0).toUpperCase();
      if (!categoriesByLetter[firstLetter]) {
        categoriesByLetter[firstLetter] = [];
      }
      categoriesByLetter[firstLetter].push(category);
    });

    // Cache the result with 24-hour expiration
    await redis.set(
      CACHE_ALPHABETICAL_CATEGORIES,
      JSON.stringify(categoriesByLetter),
      "EX",
      CACHE_EXPIRY,
    );
    console.log("Alphabetical Categories cached in Redis for 24 hours");

    return categoriesByLetter;
  } catch (error) {
    console.error("Failed to fetch alphabetical categories:", error);
    throw new Error("Failed to fetch alphabetical categories");
  }
}
