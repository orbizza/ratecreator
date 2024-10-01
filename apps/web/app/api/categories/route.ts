import { NextRequest, NextResponse } from "next/server";
import prisma from "@ratecreator/db/client";
import redis from "@ratecreator/db/redis-do";
import { Category } from "@ratecreator/types/review";

const CACHE_ROOT_CATEGORIES = "categories";
const CACHE_ALL_CATEGORIES = "all-categories";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  try {
    switch (type) {
      case "all":
        return await handleAllCategories();
      case "root":
        return await handleRootCategories();
      default:
        return NextResponse.json(
          { error: "Invalid category type" },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 },
    );
  }
}

async function handleAllCategories() {
  // Delete cache for testing db
  // await redis.del(CACHE_ALL_CATEGORIES);
  const cachedCategories = await redis.get(CACHE_ALL_CATEGORIES);
  if (cachedCategories) {
    console.log("Returning cached all categories");
    return NextResponse.json(JSON.parse(cachedCategories));
  }

  const allCategories = await prisma.category.findMany({
    orderBy: { depth: "asc" },
  });

  await redis.set(CACHE_ALL_CATEGORIES, JSON.stringify(allCategories));
  console.log("All Categories cached in Redis");

  return NextResponse.json(allCategories);
}

async function handleRootCategories() {
  // Delete cache for testing db
  // await redis.del(CACHE_ROOT_CATEGORIES);
  // await redis.del(CACHE_ALL_CATEGORIES);
  const cachedCategories = await redis.get(CACHE_ROOT_CATEGORIES);
  if (cachedCategories) {
    console.log("Returning cached root categories");
    return NextResponse.json(JSON.parse(cachedCategories));
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

  return NextResponse.json(rootCategories);
}
