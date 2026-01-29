import { atom, AtomEffect } from "recoil";
import {
  ContentType,
  ContentPlatform,
  PostStatus,
} from "@ratecreator/types/content";

const localStorageEffect =
  <T>(key: string): AtomEffect<T> =>
  ({ setSelf, onSet }) => {
    if (typeof window !== "undefined") {
      const savedValue = localStorage.getItem(key);
      if (savedValue != null) {
        try {
          setSelf(JSON.parse(savedValue) as T);
        } catch {
          // Invalid stored value, use default
        }
      }
    }

    onSet((newValue, _, isReset) => {
      if (typeof window !== "undefined") {
        if (isReset) {
          localStorage.removeItem(key);
        } else {
          localStorage.setItem(key, JSON.stringify(newValue));
        }
      }
    });
  };

export const contentTypeAtom = atom<ContentType | null>({
  key: "contentType",
  default: null,
});

export const contentPlatformAtom = atom<ContentPlatform>({
  key: "contentPlatform",
  default: ContentPlatform.RATECREATOR,
  effects: [localStorageEffect<ContentPlatform>("contentPlatform")],
});

export const postStatusAtom = atom<PostStatus | null>({
  key: "postStatus",
  default: null,
});
