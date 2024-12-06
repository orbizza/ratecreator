"use server";

import axios from "axios";

import { CreatorData } from "@ratecreator/types/review";

interface GetCreatorDataProps {
  accountId: string;
  platform: string;
}

export async function getCreatorData({
  accountId,
  platform,
}: GetCreatorDataProps): Promise<CreatorData> {
  try {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_RATECREATOR_API_URL}/api/accounts?accountId=${accountId}&platform=${platform}`,
    );
    return response.data;
  } catch (error) {
    console.error("Failed to fetch creator data:", error);
    throw new Error("Failed to fetch creator data");
  }
}
