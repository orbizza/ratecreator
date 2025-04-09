export interface PostType {
  id: string; //ObjectId
  contentPlatform: ContentPlatform;
  title: string;
  content: string;
  featureImage: string | null;
  postUrl: string;
  publishDate: Date | null;
  tags: Tags[];
  excerpt: string;
  author: Author;
  metadataTitle: string;
  metadataDescription: string;
  metadataImageUrl: string;
  metadataKeywords: string;
  canonicalUrl: string;
  contentType: ContentType;
  status: PostStatus;
  createdAt: Date;
  updatedAt: Date;
  isFeatured: boolean;
}

export interface UpdatePostType {
  contentPlatform: ContentPlatform;
  title: string;
  content: string;
  featureImage: string | null;
  postUrl: string;
  publishDate: Date | null;
  tags: Tags[];
  excerpt: string;
  author: Author;
  metadataTitle: string;
  metadataDescription: string;
  metadataImageUrl: string;
  metadataKeywords: string;
  canonicalUrl: string;
  contentType: ContentType;
  status: PostStatus;
  isFeatured: boolean;
}
export interface FetchedPostType {
  id: string; //ObjectId
  contentPlatform: ContentPlatform;
  title: string;
  content: string;
  featureImage: string | null;
  postUrl: string;
  publishDate: Date | null;
  tags: TagOnPost[];
  excerpt: string;
  author: Author;
  metadataTitle: string;
  metadataDescription: string;
  metadataImageUrl: string;
  metadataKeywords: string;
  canonicalUrl: string;
  contentType: ContentType;
  status: PostStatus;
  createdAt: Date;
  updatedAt: Date;
  isFeatured: boolean;
  broadcastIds: string[];
}

export enum ContentType {
  BLOG = "BLOG",
  GLOSSARY = "GLOSSARY",
  NEWSLETTER = "NEWSLETTER",
  LEGAL = "LEGAL",
}

export enum ContentPlatform {
  RATECREATOR = "RATECREATOR",
  CREATOROPS = "CREATOROPS",
  UNITY = "UNITY",
  DOCUMENTATION = "DOCUMENTATION",
}

export enum PostStatus {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
  SCHEDULED = "SCHEDULED",
  DELETED = "DELETED",
}

export interface TagOnPost {
  id: string;
  postId: string;
  tagId: string;
}

export interface Tags {
  id: string;
  slug: string;
  description: string;
  imageUrl: string;
  posts: TagOnPost[];
}

export interface Author {
  id: string;
  clerkId: string;
  name: string;
  username: string;
  email: string;
  imageUrl: string;
  role: string;
}
