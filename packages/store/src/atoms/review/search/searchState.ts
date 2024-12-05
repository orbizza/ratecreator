import { atom } from "recoil";

export const platformFiltersState = atom<string[]>({
  key: "platformFiltersState",
  default: ["all"],
});

export const followersFiltersState = atom<string>({
  key: "followersFiltersState",
  default: "all",
});

export const rootCategoryFiltersState = atom<string>({
  key: "rootCategoryFiltersState",
  default: "",
});

export const ratingFiltersState = atom<string>({
  key: "ratingFiltersState",
  default: "all",
});

export const videoCountFiltersState = atom<string>({
  key: "videoCountFiltersState",
  default: "all",
});

export const reviewCountFiltersState = atom<string>({
  key: "reviewCountFiltersState",
  default: "all",
});

export const countryFiltersState = atom<string[]>({
  key: "countryFiltersState",
  default: ["ALL"],
});

export const languageFiltersState = atom<string[]>({
  key: "languageFiltersState",
  default: ["all"],
});

export const claimedFilterState = atom<boolean | null>({
  key: "claimedFilterState",
  default: null,
});

export const madeForKidsFilterState = atom<boolean | null>({
  key: "madeForKidsFilterState",
  default: null,
});

export const sortByFilterState = atom<string>({
  key: "sortByFilterState",
  default: "followed",
});

export const isDescendingFilterState = atom<boolean>({
  key: "isDescendingFilterState",
  default: true,
});

export const pageNumberState = atom<number>({
  key: "pageNumberState",
  default: 0,
});
