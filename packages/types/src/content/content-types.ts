export interface PostType {
  id: string; //ObjectId
  contentPlatform: ContentPlatform;
  title: string;
  content: string;
  featureImage: string | null;
  postUrl: string;
  publishDate: Date | null;
  tags: TagOnPost[];
  excerpt: string;
  featured: boolean;
  author: Author;
  metadataTitle: string;
  metadataDescription: string;
  metadataImageUrl: string;
  metadataKeywords: string;
  metadataAuthorName: string;
  contentType: ContentType;
  status: PostStatus;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  isFeatured: boolean;
}

export enum ContentType {
  BLOG = "BLOG",
  GLOSSARY = "GLOSSARY",
  NEWSLETTER = "NEWSLETTER",
}

export enum ContentPlatform {
  RATECREATOR = "RATECREATOR",
  CREATOROPS = "CREATOROPS",
  UNITY = "UNITY",
  DOCUMENTATION = "DOCUMENTATION",
  LEGAL = "LEGAL",
}

export enum PostStatus {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
  SCHEDULED = "SCHEDULED",
  ARCHIVED = "ARCHIVED",
  DELETED = "DELETED",
  UNPUBLISHED = "UNPUBLISHED",
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
  email: string;
  imageUrl: string;
  role: string;
}
