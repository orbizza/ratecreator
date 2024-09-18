// components/CreatorGrid.tsx
import React from "react";
import { Account } from "@ratecreator/types/review";

interface CreatorGridProps {
  creators: Account[];
}

export const CreatorGrid: React.FC<CreatorGridProps> = ({ creators }) => {
  return (
    <div className="w-3/4 grid grid-cols-3 gap-4">
      {creators.map((creator) => (
        <div key={creator.id} className="border p-4 rounded">
          <div className="flex items-center mb-2">
            <div className="w-10 h-10 bg-gray-300 rounded-full mr-2 flex items-center justify-center">
              {creator.name?.[0] || creator.handle?.[0] || "N"}
            </div>
            <h3 className="text-lg font-semibold">
              {creator.name || creator.handle}
            </h3>
          </div>
          <p className="text-sm text-gray-600">
            {/* {creator.rating} */}⭐ ({creator.categories.length} reviews)
          </p>
          <div className="flex justify-between mt-2">
            <div>
              <p className="text-sm">Followers</p>
              <p className="font-semibold">{creator.followerCount}</p>
            </div>
            <div>
              <p className="text-sm">Total Videos</p>
              <p className="font-semibold">
                {creator.ytData?.videoCount || "N/A"}
              </p>
            </div>
          </div>
          <p className="text-sm mt-2">
            Categories:{" "}
            {creator.categories.map((c) => c.category.name).join(", ")}
          </p>
        </div>
      ))}
    </div>
  );
};
