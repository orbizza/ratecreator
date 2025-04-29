import React from "react";
import Link from "next/link";
import { Category } from "@ratecreator/types/review";
import {
  Separator,
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Button,
} from "@ratecreator/ui";
import { SquareStack } from "lucide-react";

/**
 * Props for the SubCategoriesList component
 */
interface SubCategoriesProps {
  /** Array of subcategory objects to display */
  categories: Category[];
}

/**
 * SubCategoriesList Component
 *
 * A responsive component that displays subcategories in both mobile and desktop views.
 * Features include:
 * - Mobile sheet view for small screens
 * - Desktop accordion view for large screens
 * - Links to subcategory pages
 * - Empty state handling
 *
 * @component
 * @param {SubCategoriesProps} props - Component props
 * @returns {JSX.Element} A responsive subcategories component
 */
export const SubCategoriesList: React.FC<SubCategoriesProps> = ({
  categories,
}) => {
  const length = categories.length === 0;

  /**
   * CategoryContent Component
   * Renders the list of subcategories or an empty state message
   */
  const CategoryContent = () => (
    <div className='w-full'>
      {!length && (
        <ul className='list-none p-0 m-0'>
          {categories.map((subcat) => (
            <Link
              key={subcat.id}
              href={`/categories/${subcat.slug}`}
              passHref
              className='block transition-transform hover:text-primary'
            >
              <li className='text-sm py-1'>
                {subcat.name}
                <Separator className='my-2' />
              </li>
            </Link>
          ))}
        </ul>
      )}
      {length && (
        <p className='text-muted-foreground'>No sub categories available</p>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile Sheet Categories */}
      <div className='xl:hidden'>
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant='default'
              size='sm'
              className='flex items-center gap-2'
            >
              <SquareStack size={16} />
              <span className='hidden md:inline-block'>Sub Categories</span>
            </Button>
          </SheetTrigger>
          <SheetContent
            side='left'
            className='w-[300px] overflow-y-auto max-h-screen'
          >
            <SheetHeader>
              <SheetTitle className='flex text-primary items-center gap-2'>
                <SquareStack size={20} />
                Sub Categories
              </SheetTitle>
            </SheetHeader>
            <div className='mt-6'>
              <CategoryContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <div className='hidden xl:flex mt-8 rounded-lg overflow-hidden shadow-md flex-col'>
        <div className='bg-stone-50 dark:bg-gray-900 p-4 flex-grow'>
          <Accordion
            type='single'
            collapsible
            className='w-full'
            defaultValue='item-1'
          >
            <AccordionItem value='item-1' className='border-0'>
              <AccordionTrigger className='hover:no-underline'>
                <div className='flex flex-row items-center mb-2 text-primary text-lg gap-x-2'>
                  <SquareStack size={20} />
                  <p>Sub Categories</p>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <CategoryContent />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </>
  );
};

export default SubCategoriesList;
