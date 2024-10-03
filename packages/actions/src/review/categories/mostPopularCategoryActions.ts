"use server";

import axios from "axios";

import {
  PopularCategory,
  PopularCategoryWithAccounts,
} from "@ratecreator/types/review";

export async function getMostPopularCategories(): Promise<PopularCategory[]> {
  try {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_RATECREATOR_API_URL}/api/categories?type=popular-categories`
    );
    return response.data;
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    throw new Error("Failed to fetch categories");
  }
}

export async function getMostPopularCategoryWithData(): Promise<
  PopularCategoryWithAccounts[]
> {
  try {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_RATECREATOR_API_URL}/api/categories?type=popular-cat-data`
    );
    return response.data;
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    throw new Error("Failed to fetch categories");
  }
}
