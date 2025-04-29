// components/CreatorGrid.tsx
import React from "react";
import { SearchAccount } from "@ratecreator/types/review";
import { CardForSearchResult } from "../cards/card-search-results";

/**
 * Props for the CreatorGrid component
 */
interface CreatorGridProps {
  /** Array of creator objects to be displayed in the grid */
  creators: SearchAccount[];
}

/**
 * CreatorGrid Component
 *
 * A grid component that displays a collection of creator search results.
 * Renders each creator using the CardForSearchResult component in a responsive grid layout.
 * The grid adapts to different screen sizes with varying column counts.
 *
 * @component
 * @param {CreatorGridProps} props - Component props
 * @param {SearchAccount[]} props.creators - Array of creator objects to display
 * @returns {JSX.Element} A responsive grid of creator cards
 */
export const CreatorGrid: React.FC<CreatorGridProps> = ({ creators }) => {
  return (
    <div className="w-full items-center justify-center md:justify-between grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
      {creators.map((creator) => (
        <CardForSearchResult key={creator.objectID} creator={creator} />
      ))}
    </div>
  );
};
