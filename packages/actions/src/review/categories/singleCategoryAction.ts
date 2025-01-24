"use server";

import { ObjectId } from "mongodb";

import { getRedisClient } from "@ratecreator/db/redis-do";
import { getMongoClient } from "@ratecreator/db/mongo-client";

import { Category } from "@ratecreator/types/review";
import axios from "axios";

const CACHE_ALL_CATEGORIES = "category-all";

async function getSubcategories(
  categoriesCollection: any,
  parentId: string
): Promise<Category[]> {
  const subcategories = await categoriesCollection
    .find({ parentId: new ObjectId(parentId) })
    .toArray();
  return subcategories.map(serializeCategory);
}

function serializeCategory(category: any): Category {
  return {
    id: category._id ? category._id.toString() : category.id,
    name: category.name,
    slug: category.slug,
    keywords: category.keywords || [],
    shortDescription: category.shortDescription || null,
    longDescription: category.longDescription || null,
    parentId: category.parentId ? category.parentId.toString() : null,
    depth: category.depth,
    popular: category.popular,
    createdAt: new Date(category.createdAt),
    updatedAt: new Date(category.updatedAt),
    deletedAt: category.deletedAt ? new Date(category.deletedAt) : null,
    subcategories: [],
    accounts: [],
  };
}

function getSubcategoriesFromCache(
  categories: Category[],
  parentId: string
): Category[] {
  const subcategories = categories.filter((cat) => cat.parentId === parentId);
  return subcategories.map((subcat) => {
    const serialized = serializeCategory(subcat);
    serialized.subcategories = getSubcategoriesFromCache(
      categories,
      subcat.id!
    );
    return serialized;
  });
}

function buildCategoryHierarchy(
  categories: Category[],
  slug: string
): Category[] {
  const result: Category[] = [];
  let currentCategory = categories.find((cat) => cat.slug === slug);

  while (currentCategory) {
    const serializedCategory = serializeCategory(currentCategory);

    // Get all levels of subcategories
    serializedCategory.subcategories = getSubcategoriesFromCache(
      categories,
      currentCategory.id!
    );

    result.unshift(serializedCategory);

    if (!currentCategory.parentId) {
      break;
    }
    currentCategory = categories.find(
      (cat) => cat.id === currentCategory!.parentId
    );
  }

  return result;
}

export async function getCategoryDetails(
  slug: string
): Promise<Category[] | null> {
  const client = await getMongoClient();

  const redis = getRedisClient();
  try {
    const cachedCategories = await redis.get(CACHE_ALL_CATEGORIES);
    if (cachedCategories) {
      console.log("Returning categories from cache.");
      const categories: Category[] = JSON.parse(cachedCategories);

      const categoryHierarchy = buildCategoryHierarchy(categories, slug);

      if (categoryHierarchy.length === 0) {
        console.log("No category found in cache for slug:", slug);
        return null;
      }

      return categoryHierarchy;
    } else {
      const database = client.db("ratecreator");
      const categoriesCollection = database.collection<Category>("Category");

      const category = await categoriesCollection.findOne({ slug });

      if (!category) {
        console.log("No category found for slug:", slug);
        return null;
      }

      const categories: Category[] = [];
      let currentCategory: any = category;

      while (currentCategory) {
        const serializedCategory = serializeCategory(currentCategory);

        // Fetch subcategories for the current category
        serializedCategory.subcategories = await getSubcategories(
          categoriesCollection,
          serializedCategory.id
        );

        categories.unshift(serializedCategory);

        if (!currentCategory.parentId) break;

        currentCategory = await categoriesCollection.findOne({
          _id: new ObjectId(currentCategory.parentId),
        });
      }

      //ToDo: Call the api to cache all the categories
      await axios.get(
        `${process.env.NEXT_PUBLIC_RATECREATOR_API_URL}/api/categories?type=all`
      );

      return categories;
    }
  } catch (error) {
    console.error("Error fetching category details:", error);
    throw error;
  }
}
