"use server";

import prisma from "@ratecreator/db/client";
import { Category } from "@ratecreator/types/review";

export async function getCategoryData(): Promise<Category[]> {
  try {
    const categories = await prisma.category.findMany({
      include: {
        subcategories: {
          where: {
            deletedAt: null,
          },
        },
      },
      orderBy: {
        depth: "asc",
      },
    });
    // console.log(categories);

    return categories.map(
      (category: any): Category => ({
        id: category.id,
        name: category.name,
        description: category.description,
        longDescription: category.longDescription,
        parentId: category.parentId,
        depth: category.depth,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
        deletedAt: category.deletedAt,
        subcategories: category.subcategories.map(
          (sub: Category): Category => ({
            id: sub.id,
            name: sub.name,
            description: sub.description,
            longDescription: sub.longDescription,
            parentId: sub.parentId,
            depth: sub.depth,
            createdAt: sub.createdAt,
            updatedAt: sub.updatedAt,
            deletedAt: sub.deletedAt, // We're not fetching deeper levels here
          }),
        ),
      }),
    );
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    throw new Error("Failed to fetch categories");
  }
}
