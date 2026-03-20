"use client";

import { useState } from "react";
import { Bookmark } from "lucide-react";
import { Button } from "../../ui/button";
import { cn } from "@ratecreator/ui/utils";
import { SaveToListModal } from "./save-to-list-modal";

interface SaveToListButtonProps {
  accountId: string;
  isSaved?: boolean;
  getListsForAccount: (accountId: string) => Promise<
    Array<{
      id: string;
      name: string;
      isDefault: boolean;
      hasAccount: boolean;
    }>
  >;
  addToMultipleLists: (
    accountId: string,
    listIds: string[],
  ) => Promise<{ success: boolean }>;
  createList: (input: {
    name: string;
    description?: string;
    isPublic?: boolean;
  }) => Promise<{ success: boolean; listId: string }>;
  ensureDefaultList: (userId: string) => Promise<string>;
  variant?: "icon" | "button";
}

export function SaveToListButton({
  accountId,
  isSaved = false,
  getListsForAccount,
  addToMultipleLists,
  createList,
  variant = "icon",
}: SaveToListButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [saved, setSaved] = useState(isSaved);

  return (
    <>
      <Button
        variant="ghost"
        size={variant === "icon" ? "icon" : "sm"}
        onClick={() => setIsOpen(true)}
        className={cn(
          variant === "button" && "gap-2",
          saved && "text-yellow-500",
        )}
      >
        <Bookmark className={cn("h-4 w-4", saved && "fill-current")} />
        {variant === "button" && (saved ? "Saved" : "Save")}
      </Button>
      <SaveToListModal
        open={isOpen}
        onOpenChange={setIsOpen}
        accountId={accountId}
        getListsForAccount={getListsForAccount}
        addToMultipleLists={addToMultipleLists}
        createList={createList}
        onSaveChange={setSaved}
      />
    </>
  );
}
