import axios from "axios";
import { SearchResults, SearchAccountsParams } from "@ratecreator/types/review";

export const searchCreators = async (
  params: SearchAccountsParams
): Promise<SearchResults[]> => {
  const response = await axios.get("/api/search/accounts", {
    headers: {
      "Content-Type": "application/json",
    },
    params,
  });

  return response.data;
};
