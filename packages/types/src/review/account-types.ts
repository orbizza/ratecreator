import { CategoryMapping } from "./category-mapping-types";

export enum Platform {
  YOUTUBE = "YOUTUBE",
  TWITTER = "TWITTER",
  INSTAGRAM = "INSTAGRAM",
  REDDIT = "REDDIT",
  TIKTOK = "TIKTOK",
  TWITCH = "TWITCH",
}

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
  tiktokData?: any;
  redditData?: any;
  xData?: any;
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

export interface CreatorData {
  account: {
    id: string;
    platform: string;
    accountId: string;
    handle: string;
    name_en: string;
    name: string;
    description_en: string;
    description: string;
    keywords_en: string;
    keywords: string;
    followerCount: number;
    imageUrl: string;
    country: string | null;
    language_code: string;
    rating: number;
    reviewCount: number;
    ytData?: {
      snippet?: {
        publishedAt: string;
        thumbnails?: {
          default?: { url: string; width: number; height: number };
          medium?: { url: string; width: number; height: number };
          high?: { url: string; width: number; height: number };
        };
      };
      statistics?: {
        viewCount: string;
        videoCount: string;
      };
      status?: {
        madeForKids: boolean;
      };
      brandingSettings?: {
        image?: {
          bannerExternalUrl?: string;
        };
      };
    };
    tiktokData?: {
      verified?: boolean;
      privateAccount?: boolean;
      friendCount?: number;
      following?: number;
      likes?: number;
      videos?: number;
      diggCount?: number;
      heart?: number;
      bio_link?: string;
      is_under_age?: boolean;
      is_secret?: boolean;
      is_star?: boolean;
      enterprise_verified?: boolean;
    };
    xData?: {
      verified?: boolean;
      protected?: boolean;
      profile_banner_url?: string;
      verified_type?: string;
      most_recent_tweet_id?: string;
      pinned_tweet_id?: string;
      location_en?: string;
      location?: string;
      created_at?: string;
      public_metrics?: {
        followers_count?: number;
        following_count?: number;
        tweet_count?: number;
        listed_count?: number;
        like_count?: number;
        media_count?: number;
      };
      entities?: {
        url?: {
          urls?: {
            url?: string;
            expanded_url?: string;
            display_url?: string;
          }[];
        };
        description?: {
          urls?: {
            url?: string;
            expanded_url?: string;
            display_url?: string;
            start?: number;
            end?: number;
          }[];
          mentions?: {
            username?: string;
            start?: number;
            end?: number;
          }[];
          hashtags?: {
            tag?: string;
            start?: number;
            end?: number;
          }[];
          cashtags?: {
            tag?: string;
            start?: number;
            end?: number;
          }[];
        };
      };
    };
    redditData?: {
      about?: {
        data?: {
          display_name?: string;
          description?: string;
          submit_text?: string;
          lang?: string;
          created_utc?: number;
          advertiser_category?: string;
          community_icon?: string;
          icon_img?: string;
          banner_img?: string;
          banner_background_image?: string;
        };
      };
      // rules?: {
      //   rules?: {
      //     description?: string;
      //     short_name?: string;
      //     violation_reason?: string;
      //     created_utc?: number;
      //     priority?: number;
      //     kind?: string;
      //   }[];
      //   siteRules?: [];
      // };
      // sticky?: {
      //   kind?: string; // Listing
      //   data?: {
      //     children?: {
      //       kind?: string; // Only T3
      //       data?: {
      //         title?: string;
      //         created_utc?: number;
      //         selftext?: string;
      //         author?: string;
      //         author_fullname?: string;
      //         url?: string;
      //         ups?: number;
      //         num_crossposts?: number;
      //         num_comments?: number;
      //         stickied?: boolean;
      //         preview?: {
      //           images?: {
      //             source?: {
      //               url?: string;
      //             };
      //           }[];
      //         };
      //       };
      //     }[];
      //   }[];
      // }[];
    };
  };
  categories: string[];
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
