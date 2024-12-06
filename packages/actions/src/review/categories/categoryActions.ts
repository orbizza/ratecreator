"use server";

import axios from "axios";

import { Category } from "@ratecreator/types/review";

export async function getCategoryData(): Promise<Category[]> {
  try {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_RATECREATOR_API_URL}/api/categories?type=root`
    );
    return response.data;
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    throw new Error("Failed to fetch categories");
  }
}
