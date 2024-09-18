// packages/types/src/category.ts
import { CategoryMapping } from "./category-mapping-types"; // Import the CategoryMapping type

export interface Category {
  id: string;
  name: string;
  slug: string;
  shortDescription?: string | null;
  longDescription?: string | null;
  parentId?: string | null;
  parent?: Category | null;
  subcategories?: Category[];
  depth: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  accounts?: CategoryMapping[];
}

export interface SearchResult extends Category {
  parentCategory?: string;
}

export interface CategoryWithColor extends Category {
  bgColor: string;
  hoverColor: string;
}

export interface CategoryCardProps {
  category: CategoryWithColor;
}
