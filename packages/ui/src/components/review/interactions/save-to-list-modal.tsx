"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Globe, Lock } from "lucide-react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Checkbox } from "../../ui/checkbox";
import { Label } from "../../ui/label";
import { Switch } from "../../ui/switch";
import { Separator } from "../../ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../ui/dialog";

interface ListInfo {
  id: string;
  name: string;
  isDefault: boolean;
  hasAccount: boolean;
}

interface SaveToListModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId: string;
  getListsForAccount: (accountId: string) => Promise<ListInfo[]>;
  addToMultipleLists: (
    accountId: string,
    listIds: string[],
  ) => Promise<{ success: boolean }>;
  createList: (input: {
    name: string;
    description?: string;
    isPublic?: boolean;
  }) => Promise<{ success: boolean; listId: string }>;
  onSaveChange?: (isSaved: boolean) => void;
}

export function SaveToListModal({
  open,
  onOpenChange,
  accountId,
  getListsForAccount,
  addToMultipleLists,
  createList,
  onSaveChange,
}: SaveToListModalProps) {
  const [lists, setLists] = useState<ListInfo[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showNewForm, setShowNewForm] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [newListPublic, setNewListPublic] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    let mounted = true;

    const load = async () => {
      setLoading(true);
      try {
        const result = await getListsForAccount(accountId);
        if (mounted) {
          setLists(result);
          setSelectedIds(
            new Set(result.filter((l) => l.hasAccount).map((l) => l.id)),
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [open, accountId, getListsForAccount]);

  const handleToggle = useCallback((listId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(listId)) {
        next.delete(listId);
      } else {
        next.add(listId);
      }
      return next;
    });
  }, []);

  const handleCreateList = useCallback(async () => {
    if (!newListName.trim()) return;
    setLoading(true);
    try {
      const result = await createList({
        name: newListName.trim(),
        isPublic: newListPublic,
      });
      if (result.success) {
        setLists((prev) => [
          ...prev,
          {
            id: result.listId,
            name: newListName.trim(),
            isDefault: false,
            hasAccount: false,
          },
        ]);
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.add(result.listId);
          return next;
        });
        setNewListName("");
        setNewListPublic(false);
        setShowNewForm(false);
      }
    } finally {
      setLoading(false);
    }
  }, [newListName, newListPublic, createList]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await addToMultipleLists(accountId, Array.from(selectedIds));
      onSaveChange?.(selectedIds.size > 0);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }, [accountId, selectedIds, addToMultipleLists, onSaveChange, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save to list</DialogTitle>
        </DialogHeader>

        {loading && lists.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Loading lists...
          </div>
        ) : (
          <div className="max-h-64 space-y-1 overflow-y-auto">
            {lists.map((list) => (
              <label
                key={list.id}
                className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 hover:bg-accent/50"
              >
                <Checkbox
                  checked={selectedIds.has(list.id)}
                  onCheckedChange={() => handleToggle(list.id)}
                />
                <span className="flex-1 text-sm">{list.name}</span>
                {list.isDefault && (
                  <span className="text-xs text-muted-foreground">Default</span>
                )}
              </label>
            ))}
          </div>
        )}

        <Separator />

        {showNewForm ? (
          <div className="space-y-3">
            <Input
              placeholder="List name"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateList()}
              autoFocus
            />
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-sm">
                {newListPublic ? (
                  <Globe className="h-3.5 w-3.5" />
                ) : (
                  <Lock className="h-3.5 w-3.5" />
                )}
                {newListPublic ? "Public" : "Private"}
              </Label>
              <Switch
                checked={newListPublic}
                onCheckedChange={setNewListPublic}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNewForm(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleCreateList}
                disabled={!newListName.trim() || loading}
              >
                Create
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={() => setShowNewForm(true)}
          >
            <Plus className="h-4 w-4" />
            Create new list
          </Button>
        )}

        <DialogFooter>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Done"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
