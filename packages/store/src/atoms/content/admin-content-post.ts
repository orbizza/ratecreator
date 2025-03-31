import { atom } from "recoil";
import {
  ContentPlatform,
  ContentType,
  PostStatus,
  PostType,
  Tags,
} from "@ratecreator/types/content";

export const postState = atom({
  key: "postState",
  default: {
    title: "",
    content: "",
    featureImage: "",
    postUrl: "",
    publishDate: null as Date | null,
    excerpt: "",
    featured: false,
    tags: [] as Tags[],
    authors: "",
    contentPlatform: ContentPlatform.RATECREATOR,
    contentType: ContentType.BLOG,
    status: PostStatus.DRAFT,
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    canonicalUrl: "",
    metadataTitle: "",
    metadataDescription: "",
    metadataImageUrl: "",
    metadataKeywords: "",
    metadataAuthorName: "",
  },
});

export const selectDate = atom<Date>({
  key: "selectDate",
  default: new Date(),
});

export const selectedTimeIst = atom<string>({
  key: "selectedTimeIst",
  default: "23:59",
});

export const postIdState = atom<string | null>({
  key: "postIdState",
  default: null,
});

export const postDataState = atom<PostType | null>({
  key: "postDataState",
  default: null,
});

export const errorDuplicateUrlState = atom<string | null>({
  key: "errorDuplicateUrlState",
  default: null,
});

export const tagsState = atom<Tags[]>({
  key: "tagsState",
  default: [],
});

export const selectedTagsState = atom<Tags[]>({
  key: "selectedTagsState",
  default: [],
});

export const pageNumberState = atom<number>({
  key: "pageNumberState",
  default: 0,
});

export const savePostErrorState = atom<string | null>({
  key: "savePostErrorState",
  default: null,
});

export const blogPageNumberState = atom<number>({
  key: "blogPageNumberState",
  default: 0,
});

export const postStatusState = atom<PostStatus>({
  key: "postStatusState",
  default: PostStatus.DRAFT,
});

export const postTypeState = atom<ContentType>({
  key: "postTypeState",
  default: ContentType.BLOG,
});

export const postPlatformState = atom<ContentPlatform>({
  key: "postPlatformState",
  default: ContentPlatform.RATECREATOR,
});

export const metadataToggleState = atom<boolean>({
  key: "metadataToggleState",
  default: true,
});
