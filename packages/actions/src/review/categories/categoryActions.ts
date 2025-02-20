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

    await redis.set(CACHE_ALL_CATEGORIES, JSON.stringify(allCategories));
    console.log("All Categories cached in Redis");
    await redis.set(CACHE_ROOT_CATEGORIES, JSON.stringify(rootCategories));
    console.log("Root Categories cached in Redis");

    return rootCategories;
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    throw new Error("Failed to fetch categories");
  }
}
