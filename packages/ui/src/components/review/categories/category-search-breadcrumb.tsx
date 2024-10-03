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

interface CategoryBreadcrumbProps {
  categories: Category[];
}

export const CategoryBreadcrumb: React.FC<CategoryBreadcrumbProps> = ({
  categories,
}) => {
  if (categories.length === 0) return null;

  const currentCategory = categories[categories.length - 1];
  const parentCategory =
    categories.length > 1 ? categories[categories.length - 2] : null;

  let visibleCategories: Category[];
  let hiddenCategories: Category[] = [];

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
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href='/categories'>Category</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />

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
                      <BreadcrumbLink href={`/categories/${category.slug}`}>
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

        {visibleCategories.map((category, index) => (
          <React.Fragment key={category.id}>
            <BreadcrumbItem>
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
