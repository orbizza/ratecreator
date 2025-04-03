import { atom } from "recoil";
import {
  ContentType,
  ContentPlatform,
  PostStatus,
} from "@ratecreator/types/content";

export const contentTypeAtom = atom<ContentType | null>({
  key: "contentType",
  default: null,
});

export const contentPlatformAtom = atom<ContentPlatform>({
  key: "contentPlatform",
  default: ContentPlatform.RATECREATOR,
});

export const postStatusAtom = atom<PostStatus | null>({
  key: "postStatus",
  default: null,
});
