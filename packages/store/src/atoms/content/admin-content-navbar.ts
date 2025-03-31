import { atom } from "recoil";
import {
  ContentType,
  ContentPlatform,
  PostStatus,
} from "@ratecreator/types/content";

export const contentTypeAtom = atom<ContentType>({
  key: "contentType",
  default: ContentType.BLOG,
});

export const contentPlatformAtom = atom<ContentPlatform>({
  key: "contentPlatform",
  default: ContentPlatform.RATECREATOR,
});

export const postStatusAtom = atom<PostStatus>({
  key: "postStatus",
  default: PostStatus.DRAFT,
});
