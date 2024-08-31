import { atom } from "recoil";

export const showToastState = atom({
  key: "showToastState",
  default: false,
});

export const showToastEmailState = atom({
  key: "showToastEmailState",
  default: false,
});
