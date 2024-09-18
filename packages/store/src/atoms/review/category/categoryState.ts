import { atom, selector } from "recoil";
import { CategoryWithColor, Category } from "@ratecreator/types/review";

export const categoriesState = atom<Category[]>({
  key: "categoriesState",
  default: [],
});

export const categoriesWithColorState = atom<CategoryWithColor[]>({
  key: "categoriesWithColorState",
  default: [],
});

export const categoriesLoadingState = atom<boolean>({
  key: "categoriesLoadingState",
  default: true,
});

export const categoriesErrorState = atom<string | null>({
  key: "categoriesErrorState",
  default: null,
});

export const getCategoryBySlug = selector({
  key: "getCategoryBySlug",
  get:
    ({ get }) =>
    (slug: string) => {
      const categories = get(categoriesState);
      return categories.find((category) => category.slug === slug);
    },
});

export const getCategoryWithColorBySlug = selector({
  key: "getCategoryWithColorBySlug",
  get:
    ({ get }) =>
    (slug: string) => {
      const categoriesWithColor = get(categoriesWithColorState);
      return categoriesWithColor.find((category) => category.slug === slug);
    },
});

export const allCategoriesSelector = selector({
  key: "allCategoriesSelector",
  get: ({ get }) => {
    const categories = get(categoriesState);
    const categoriesWithColor = get(categoriesWithColorState);
    return { categories, categoriesWithColor };
  },
});
