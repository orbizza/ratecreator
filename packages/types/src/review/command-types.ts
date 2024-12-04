export interface SearchCreator {
  name: string;
  platform: string;
  accountId: string;
  handle: string;
  followerCount: number;
  rating: number;
  reviews: number;
  imageUrl: string;
  setOpen?: () => void;
}

export interface SearchCategory {
  name: string;
  items: SearchCreator[];
}

export interface SearchCategoryItem {
  name: string;
  isCategory: true;
}

export type FilteredItem = SearchCreator | SearchCategoryItem;

export interface FilteredCategory {
  name: string;
  items: FilteredItem[];
}

export type TabType = "All" | "YouTube" | "Reddit" | "X";
