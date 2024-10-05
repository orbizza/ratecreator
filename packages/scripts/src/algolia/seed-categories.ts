import pLimit from "p-limit";
import { getWriteClient } from "@ratecreator/db/algolia-client";
import { getPrismaClient } from "@ratecreator/db/client";
import { ObjectId } from "mongodb"; // Import the ObjectId type if using MongoDB

const prisma = getPrismaClient();
const client = getWriteClient();
const limit = pLimit(20); // Adjust concurrency limit as needed

const seedData = async () => {
  const categories = await prisma.category.findMany();

  // Build a map of categoryId (as string) to category data
  const categoryMap = new Map<
    string,
    { id: string; name: string; parentId: string | null }
  >();

  categories.forEach((category) => {
    const categoryIdStr = category.id.toString(); // Convert ObjectId to string
    const parentIdStr = category.parentId ? category.parentId.toString() : null; // Convert parentId to string if it exists

    categoryMap.set(categoryIdStr, {
      id: categoryIdStr,
      name: category.name,
      parentId: parentIdStr,
    });
  });

  // Helper function to get the full path of a category excluding the current category's name
  const getParentPath = (categoryId: string): string => {
    let path = "";
    let currentCategory = categoryMap.get(categoryId);

    while (currentCategory && currentCategory.parentId) {
      const parentCategory = categoryMap.get(currentCategory.parentId);
      if (parentCategory) {
        // Prepend the parent category name to the path
        path = path ? `${parentCategory.name} > ${path}` : parentCategory.name;
        // Move up to the parent
        currentCategory = parentCategory;
      } else {
        break;
      }
    }

    return path;
  };

  const promises = categories.map(async (category) => {
    const categoryIdStr = category.id.toString();
    const parentIdStr = category.parentId ? category.parentId.toString() : null;

    // Get the parent category name hierarchy
    const parentCategoryName = getParentPath(categoryIdStr);

    return limit(() =>
      client.saveObject({
        indexName: "categories",
        body: {
          objectID: categoryIdStr,
          name: category.name,
          slug: category.slug,
          shortDescription: category.shortDescription,
          longDescription: category.longDescription,
          keywords: category.keywords,
          parentId: parentIdStr,
          parentCategory: parentCategoryName, // The hierarchical parent name
          popular: category.popular,
          depth: category.depth,
          createdAt: category.createdAt,
          updatedAt: category.updatedAt,
        },
      }),
    );
  });

  const responses = await Promise.all(promises);
  console.log("Categories seeded with count: ", responses.length);
};

seedData().catch(console.error);
