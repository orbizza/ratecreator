import axios from "axios";
import { SearchResults } from "@ratecreator/types/review";

interface SearchCreatorsParams {
  query?: string;
  page?: number;
  limit?: number;
  filters?: {
    platform?: string[];
    followers?: { min: number; max: number };
    rating?: { min: number; max: number };
    videoCount?: { min: number; max: number };
    reviewCount?: { min: number; max: number };
    country?: string[];
    language?: string[];
    claimed?: boolean;
    madeForKids?: boolean;
    categories?: string[];
  };
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export const searchCreators = async (
  params: SearchCreatorsParams,
): Promise<SearchResults[]> => {
  const response = await axios.get("/api/search/accounts", {
    headers: {
      "Content-Type": "application/json",
    },
    params,
  });

  return response.data.searchResults;
};
