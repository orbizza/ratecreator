"use server";

import { MongoClient, ObjectId } from "mongodb";
import { Category } from "@ratecreator/types/review";

const uri = process.env.DATABASE_URL || "";

if (!uri) {
  console.log("DATABASE_URL: " + uri);
  throw new Error("DATABASE_URL environment variable is not set");
}

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
    id: category._id ? category._id.toString() : undefined,
    name: category.name,
    slug: category.slug,
    shortDescription: category.shortDescription || null,
    longDescription: category.longDescription || null,
    parentId: category.parentId ? category.parentId.toString() : null,
    depth: category.depth,
    createdAt: category.createdAt
      ? category.createdAt.toISOString()
      : new Date().toISOString(),
    updatedAt: category.updatedAt
      ? category.updatedAt.toISOString()
      : new Date().toISOString(),
    deletedAt: category.deletedAt ? category.deletedAt.toISOString() : null,
    subcategories: [], // This will be populated later
    accounts: [],
  };
}

export async function getCategoryDetails(
  slug: string
): Promise<Category[] | null> {
  let client: MongoClient | null = null;

  try {
    client = new MongoClient(uri);
    await client.connect();
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

    return categories;
  } catch (error) {
    console.error("Error fetching category details:", error);
    throw error;
  } finally {
    if (client) await client.close();
  }
}
