// packages/types/src/category.ts
import { CategoryMapping } from "./category-mapping-types";
import { PopularAccount } from "./account-types";

export interface Category {
  id: string;
  name: string;
  slug: string;
  keywords: String[];
  shortDescription?: string | null;
  longDescription?: string | null;
  parentId?: string | null;
  parent?: Category | null;
  subcategories?: Category[];
  depth: number;
  popular: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  accounts?: CategoryMapping[];
}

export interface GlossaryCategory {
  id: string;
  name: string;
  slug: string;
  shortDescription?: string | null;
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
export interface PopularCategory {
  id: string;
  name: string;
  slug: string;
}

export interface PopularCategoryWithAccounts {
  category: Category;
  accounts: PopularAccount[];
}
