// components/CreatorGrid.tsx
import React from "react";
import { SearchAccount } from "@ratecreator/types/review";
import { CardForSearchResult } from "../cards/card-search-results";

interface CreatorGridProps {
  creators: SearchAccount[];
}

export const CreatorGrid: React.FC<CreatorGridProps> = ({ creators }) => {
  return (
    <div className='w-full items-center justify-center md:justify-between grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4'>
      {creators.map((creator) => (
        <CardForSearchResult key={creator.objectID} creator={creator} />
      ))}
    </div>
  );
};
