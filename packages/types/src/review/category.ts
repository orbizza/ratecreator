// packages/types/src/category.ts
export interface Category {
  id: string;
  name: string;
  description?: string | null;
  longDescription?: string | null;
  parentId?: string | null;
  subcategories?: Category[];
  depth: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}
