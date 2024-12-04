import { CategoryMapping } from "./category-mapping-types";

export interface Account {
  id: string;
  platform: string;
  accountId: string;
  handle?: string;
  name?: string;
  name_en?: string;
  followerCount?: number;
  imageUrl?: string;
  country?: string;
  description?: string;
  description_en?: string;
  keywords?: string;
  keywords_en?: string;
  categories: CategoryMapping[];
  ytData?: any;
  isSeeded: boolean;
  isSuspended: boolean;
  ranking?: any;
  createdAt: Date;
  updatedAt: Date;
  language_code?: string;
  lang_confidence_score?: number;
  rating?: number;
  reviewCount?: number;
  lastIndexedAt?: Date;
}

export interface SearchResults {
  hits: SearchAccount[];
  nbHits: number;
  page: number;
  nbPages: number;
  hitsPerPage: number;
  facets: {
    platform?: { [key: string]: number };
    categories?: { [key: string]: number };
    country?: { [key: string]: number };
    language_code?: { [key: string]: number };
    madeForKids?: { [key: string]: number };
  };
  exhaustiveFacetsCount: boolean;
  exhaustiveNbHits: boolean;
  exhaustiveTypo: boolean;
  exhaustive: {
    facetsCount: boolean;
    nbHits: boolean;
    typo: boolean;
  };
  query: string;
  params: string;
  index: string;
  renderingContent: Record<string, unknown>;
  processingTimeMS: number;
  processingTimingsMS: Record<string, number>;
  serverTimeMS: number;
}

export interface SearchAccount {
  accountId: string;
  platform: string;
  handle: string;
  name: string;
  description?: string;
  keywords?: string;
  followerCount: number;
  imageUrl: string;
  country?: string;
  language_code?: string;
  rating: number;
  reviewCount: number;
  madeForKids: boolean;
  viewCount?: number;
  videoCount?: number;
  bannerURL?: string;
  categories: string[];
  createdDate: string;
  objectID: string;
}

export interface SearchAccountsParams {
  query?: string;
  page?: number;
  limit?: number;
  filters?: {
    platform?: string[];
    followers?: string | { min: number; max: number };
    rating?: string | { min: number; max: number };
    videoCount?: string | { min: number; max: number };
    reviewCount?: string | { min: number; max: number };
    country?: string[];
    language?: string[];
    claimed?: boolean;
    madeForKids?: boolean;
    categories?: string[];
  };
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PopularAccount {
  id: string;
  accountId: string;
  name: string;
  handle: string;
  platform: string;
  imageUrl: string;
  followerCount: number;
  rating: number;
  reviewCount: number;
}
