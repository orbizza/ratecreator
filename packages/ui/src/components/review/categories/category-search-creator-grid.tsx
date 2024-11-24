// components/CreatorGrid.tsx
import React from "react";
import { SearchAccount } from "@ratecreator/types/review";
import { CardForSearchResult } from "../cards/card-search-results";

interface CreatorGridProps {
  creators: SearchAccount[];
}

export const CreatorGrid: React.FC<CreatorGridProps> = ({ creators }) => {
  return (
    <div className='w-full grid grid-cols-3 gap-4'>
      {creators.map((creator) => (
        <CardForSearchResult key={creator.accountId} creator={creator} />
      ))}
    </div>
  );
};
