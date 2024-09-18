import { Category } from "./category-types";
import { Account } from "./account-types";

export interface CategoryMapping {
  id: string;
  accountId: string;
  categoryId: string;
  account: Account;
  category: Category;
}
