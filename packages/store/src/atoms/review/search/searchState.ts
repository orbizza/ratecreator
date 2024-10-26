import { useRecoilState, atom } from "recoil";

import { Account } from "@ratecreator/types/review";

export const searchPlatformState = atom<string>({
  key: "searchPlatformState",
  default: "ALL",
});

export const searchResultsState = atom<Account[]>({
  key: "searchResultsState",
  default: [],
});
