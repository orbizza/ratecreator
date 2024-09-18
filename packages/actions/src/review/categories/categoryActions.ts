"use server";

import prisma from "@ratecreator/db/client";
import { Category } from "@ratecreator/types/review";

export async function getCategoryData(): Promise<Category[]> {
  try {
    // Test database connection
    // await prisma.$connect();
    // console.log("Database connection successful");

    // Count all categories without any conditions
    // const totalCount = await prisma.category.count();
    // console.log("Total categories in database:", totalCount);

    // Count categories that are not deleted
    // const nonDeletedCount = await prisma.category.count({
    //   where: {
    //     deletedAt: null,
    //   },
    // });
    // console.log("Non-deleted categories:", nonDeletedCount);

    // Fetch all categories without any conditions
    const allCategories = await prisma.category.findMany({
      orderBy: {
        depth: "asc",
      },
    });

    // console.log("All categories fetched:", allCategories.length);
    // console.log("Sample category:", allCategories[0]);

    // Original logic starts here
    const categoryMap: { [key: string]: Category } = {};

    allCategories.forEach((category) => {
      categoryMap[category.id] = {
        ...category,
        subcategories: [],
      };
    });

    // console.log("Category map created. Keys:", Object.keys(categoryMap).length);

    const rootCategories: Category[] = [];
    allCategories.forEach((category) => {
      if (category.parentId) {
        const parentId = categoryMap[category.parentId];
        if (parentId) {
          parentId.subcategories?.push(categoryMap[category.id]);
        } else {
          console.warn(`Parent category not found for: ${category.id}`);
        }
      } else {
        rootCategories.push(categoryMap[category.id]);
      }
    });

    // console.log("Root categories found:", rootCategories.length);
    // console.log("Sample root category:", rootCategories[0]);

    return rootCategories;
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    throw new Error("Failed to fetch categories");
  }
  // finally {
  //   await prisma.$disconnect();
  // }
}
