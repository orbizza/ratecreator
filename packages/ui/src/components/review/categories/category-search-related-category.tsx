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
import { ArrowRightLeft } from "lucide-react";

/**
 * Props for the RelatedCategories component
 */
interface RelatedCategoriesProps {
  /** Array of related category objects to display */
  categories: Category[];
}

/**
 * RelatedCategories Component
 *
 * A responsive component that displays related categories in both mobile and desktop views.
 * Features include:
 * - Mobile sheet view for small screens
 * - Desktop accordion view for large screens
 * - Links to category pages
 * - Empty state handling
 *
 * @component
 * @param {RelatedCategoriesProps} props - Component props
 * @returns {JSX.Element} A responsive related categories component
 */
export const RelatedCategories: React.FC<RelatedCategoriesProps> = ({
  categories,
}) => {
  const length = categories.length === 0;

  /**
   * CategoryContent Component
   * Renders the list of related categories or an empty state message
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
        <p className='text-muted-foreground'>No related categories found</p>
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
              <ArrowRightLeft size={16} />
              <span className='hidden md:inline-block'>Related Categories</span>
            </Button>
          </SheetTrigger>
          <SheetContent
            side='left'
            className='w-[300px] overflow-y-auto max-h-screen'
          >
            <SheetHeader>
              <SheetTitle className='flex text-primary items-center gap-2'>
                <ArrowRightLeft size={20} />
                Related Categories
              </SheetTitle>
            </SheetHeader>
            <div className='mt-6'>
              <CategoryContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <div className='hidden xl:flex mt-8 mb-8 rounded-lg overflow-hidden shadow-md flex-col'>
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
                  <ArrowRightLeft size={20} />
                  <p>Related Categories</p>
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

export default RelatedCategories;
