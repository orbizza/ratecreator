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

export interface SearchAccount {
  accountId: string;
  name?: string;
  handle?: string;
  description?: string;
  categories: string[];
  platform: string;
  keywords?: string;
  country?: string;
  language_code?: string;
  followerCount?: number;
  imageUrl?: string;
  rating?: number;
  reviewCount?: number;
  madeForKids?: boolean;
  viewCount?: number;
  videoCount?: number;
  bannerImageUrl?: string;
  createdAt: string;
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
