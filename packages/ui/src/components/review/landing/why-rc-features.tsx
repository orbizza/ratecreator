/**
 * RcFeatureSection Component
 *
 * This component displays a grid of features highlighting the benefits of Rate Creator, featuring:
 * - Responsive grid layout
 * - Interactive feature cards with hover effects
 * - Icon-based feature representation
 * - Animated transitions and gradients
 *
 * The component uses a combination of Tailwind CSS and custom animations
 * to create an engaging feature showcase section.
 */

"use client";

import { cn } from "@ratecreator/ui/utils";
import { Features } from "@ratecreator/store";

/**
 * Main RcFeatureSection Component
 * Renders a grid of feature cards using data from the Features store
 */
export function RcFeatureSection() {
  const features = Features;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4  relative z-10 py-10 max-w-7xl mx-auto">
      {features.map((feature, index) => (
        <Feature key={feature.title} {...feature} index={index} />
      ))}
    </div>
  );
}

/**
 * Feature Component
 * Renders an individual feature card with hover effects and animations
 *
 * @param title - The title of the feature
 * @param description - A description of the feature
 * @param icon - The icon component to display
 * @param index - The index of the feature in the grid
 */
const Feature = ({
  title,
  description,
  icon: Icon,
  index,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  index: number;
}) => {
  return (
    <div
      className={cn(
        "flex flex-col lg:border-r  py-10 relative group/feature dark:border-neutral-800",
        (index === 0 || index === 4) && "lg:border-l dark:border-neutral-800",
        index < 4 && "lg:border-b dark:border-neutral-800",
      )}
    >
      {/* Top gradient overlay for first row features */}
      {index < 4 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-t from-neutral-100 dark:from-neutral-800 to-transparent pointer-events-none" />
      )}
      {/* Bottom gradient overlay for second row features */}
      {index >= 4 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-b from-neutral-100 dark:from-neutral-800 to-transparent pointer-events-none" />
      )}

      {/* Feature icon */}
      <div className="mb-4 relative z-10 px-10 text-neutral-600 dark:text-neutral-400">
        <Icon />
      </div>

      {/* Feature title with animated indicator */}
      <div className="text-lg font-bold mb-2 relative z-10 px-10">
        <div className="absolute left-0 inset-y-0 h-6 group-hover/feature:h-8 w-1 rounded-tr-full rounded-br-full bg-neutral-300 dark:bg-neutral-700 group-hover/feature:bg-rose-500 transition-all duration-200 origin-center" />
        <span className="group-hover/feature:translate-x-2 transition duration-200 inline-block text-neutral-800 dark:text-neutral-100">
          {title}
        </span>
      </div>

      {/* Feature description */}
      <p className="text-sm text-neutral-600 dark:text-neutral-300 max-w-xs relative z-10 px-10">
        {description}
      </p>
    </div>
  );
};
