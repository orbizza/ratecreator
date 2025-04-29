import React from "react";
import { Category } from "@ratecreator/types/review";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@ratecreator/ui";

/**
 * Props for the CategoryBreadcrumb component
 */
interface CategoryBreadcrumbProps {
  /** Array of category objects representing the breadcrumb path */
  categories: Category[];
}

/**
 * CategoryBreadcrumb Component
 *
 * A breadcrumb navigation component that displays the category hierarchy.
 * Features include:
 * - Dynamic breadcrumb generation based on category depth
 * - Dropdown menu for hidden categories
 * - Responsive text sizing
 * - Current category highlighting
 *
 * @component
 * @param {CategoryBreadcrumbProps} props - Component props
 * @returns {JSX.Element | null} A breadcrumb navigation component or null if no categories
 */
export const CategoryBreadcrumb: React.FC<CategoryBreadcrumbProps> = ({
  categories,
}) => {
  if (categories.length === 0) return null;

  // Get current and parent categories
  const currentCategory = categories[categories.length - 1];
  const parentCategory =
    categories.length > 1 ? categories[categories.length - 2] : null;

  let visibleCategories: Category[];
  let hiddenCategories: Category[] = [];

  /**
   * Determine which categories to show and hide based on depth
   */
  if (currentCategory.depth === 2) {
    // For depth 2, show only parent and current category
    visibleCategories = [parentCategory!, currentCategory];
    hiddenCategories = categories.slice(0, -2);
  } else if (categories.length > 3) {
    // For depth > 2, show root, parent, and current category
    visibleCategories = [categories[0], parentCategory!, currentCategory];
    hiddenCategories = categories.slice(1, -2);
  } else {
    // For depth 0 or 1, show all categories
    visibleCategories = categories;
  }

  return (
    <Breadcrumb className='lg:mb-4'>
      <BreadcrumbList>
        {/* Root category link */}
        <BreadcrumbItem>
          <BreadcrumbLink href='/categories' className='text-[12px] lg:text-sm'>
            Category
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />

        {/* Hidden categories dropdown */}
        {hiddenCategories.length > 0 && (
          <>
            <BreadcrumbItem>
              <DropdownMenu>
                <DropdownMenuTrigger className='flex items-center gap-1'>
                  <BreadcrumbEllipsis className='size-4' />
                  <span className='sr-only'>Toggle menu</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='start'>
                  {hiddenCategories.map((category) => (
                    <DropdownMenuItem key={category.id}>
                      <BreadcrumbLink
                        href={`/categories/${category.slug}`}
                        className='text-[12px] lg:text-sm'
                      >
                        {category.name}
                      </BreadcrumbLink>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
          </>
        )}

        {/* Visible categories */}
        {visibleCategories.map((category, index) => (
          <React.Fragment key={category.id}>
            <BreadcrumbItem className='text-[12px] lg:text-sm'>
              {index === visibleCategories.length - 1 ? (
                <BreadcrumbPage>{category.name}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink href={`/categories/${category.slug}`}>
                  {category.name}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {index < visibleCategories.length - 1 && <BreadcrumbSeparator />}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
};
