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
  metadataAuthorName: string;
  canonicalUrl: string;
  contentType: ContentType;
  status: PostStatus;
  isDeleted: boolean;
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
  metadataAuthorName: string;
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
  metadataAuthorName: string;
  canonicalUrl: string;
  contentType: ContentType;
  status: PostStatus;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  isFeatured: boolean;
}

// export interface PostListType {
//   id: string; //ObjectId
//   title: string;
//   featureImage: string | null;
//   postUrl: string;
//   publishDate: Date | null;
//   excerpt: string;
//   isFeatured: boolean;
//   tags: TagOnPost[];
//   author: Author;
// }

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
  email: string;
  imageUrl: string;
  role: string;
}
