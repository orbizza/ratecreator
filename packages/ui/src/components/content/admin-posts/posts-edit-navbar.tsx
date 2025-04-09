"use client";

import { useEffect, useState } from "react";
import { useRecoilState, useRecoilValue } from "recoil";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  ChevronLeft,
  PanelRightOpen,
  PanelRightClose,
  Save,
  Check,
  Loader2,
  AlertTriangle,
} from "lucide-react";

import {
  postState,
  postIdState,
  postDataState,
  errorDuplicateUrlState,
  savePostErrorState,
  metadataToggleState,
  postTypeState,
  postPlatformState,
  contentTypeAtom,
} from "@ratecreator/store/content";
import { ContentType, PostStatus, PostType } from "@ratecreator/types/content";
import {
  Button,
  Label,
  Separator,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@ratecreator/ui";
import { SelectComponent } from "@ratecreator/ui/common";
import {
  createAuthor,
  updatePost,
  createPost,
  unpublishPost,
  unschedulePost,
} from "@ratecreator/actions/content";
import { capitalizeFirstLetter, getInitials } from "@ratecreator/db/utils";
import PublishDialog from "./publish-dialog-component";

export const PostsEditNavbar = () => {
  const router = useRouter();

  const postFull = useRecoilValue(postDataState);
  const contentType = useRecoilValue(contentTypeAtom);
  const [post, setPost] = useRecoilState(postState);
  const [postType, setPostType] = useRecoilState(postTypeState);
  const [postPlatform, setPostPlatform] = useRecoilState(postPlatformState);
  const [postId, setPostId] = useRecoilState(postIdState);
  const [errorDuplicateUrl, setErrorDuplicateUrl] = useRecoilState(
    errorDuplicateUrlState,
  );

  const savePostError = useRecoilValue(savePostErrorState);

  const [isSaving, setIsSaving] = useState(false);
  const [isSavingSuccess, setIsSavingSuccess] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const isDisabled =
    post.title === "" ||
    post.postUrl === "" ||
    postFull?.status === PostStatus.DELETED;

  const [isMetadataToggle, setIsMetadataToggle] =
    useRecoilState(metadataToggleState);
  const toggleMetadata = () => {
    setIsMetadataToggle((prev) => !prev);
  };

  const contentTypes = ["blog", "glossary", "newsletter", "legal"];

  const handleSelectContentType = (item: string) => {
    setPostType(item.toUpperCase() as ContentType);
    setPost({ ...post, contentType: item.toUpperCase() as ContentType });
  };

  useEffect(() => {
    if (postFull) {
      setPostType(postFull.contentType);
      setPostPlatform(postFull.contentPlatform);
      setPostId(postFull.id);
    }
  }, [postFull, setPostId]);

  useEffect(() => {
    if (errorDuplicateUrl) {
      console.log("Error state updated:", errorDuplicateUrl);
    }
  }, [errorDuplicateUrl]);

  const handleSave = async () => {
    if (isDisabled) return;
    setErrorDuplicateUrl(null);
    setIsSaving(true);
    const user = await createAuthor();
    if (!user || "error" in user) {
      console.error("Failed to create author");
      setIsSaving(false);
      return;
    }

    const data: PostType = {
      ...post,
      author: {
        ...user,
        name: user.name ?? user.username ?? getInitials(user.email),
        username: user.username,
      },
      tags: post.tags,
      id: postId || "",
      isFeatured: post.featured,
    };
    if (postId) {
      const result = await updatePost(data, postId);
      setIsSaving(false);
      if (result && "error" in result) {
        setErrorDuplicateUrl(result.error ?? "Duplicate URL");
      } else {
        setIsSavingSuccess(true);
        setTimeout(() => {
          setIsSavingSuccess(false);
        }, 3000);
        // router.push(`/editor/${postId}`);
      }
    } else {
      const result = await createPost(data);
      setIsSaving(false);
      if (result && "error" in result) {
        setErrorDuplicateUrl(result.error ?? "Duplicate URL");
      } else if (result && "post" in result && result.post) {
        setPostId(result.post.id);
        setIsSavingSuccess(true);
        setTimeout(() => {
          setIsSavingSuccess(false);
        }, 3000);
        router.push(`/editor/${result.post.id}`);
      }
    }
  };

  const handlePublish = async () => {
    if (isDisabled || !postId) return;

    if (postFull?.status === PostStatus.PUBLISHED) {
      const result = await unpublishPost(postId);
      if (result.success) {
        // Stay on same page and update post status
        setPost({ ...post, status: PostStatus.DRAFT });
        router.refresh();
      }
    } else if (postFull?.status === PostStatus.SCHEDULED) {
      const result = await unschedulePost(postFull, postId);
      if (result.success) {
        // Stay on same page and update post status
        setPost({ ...post, status: PostStatus.DRAFT });
        router.refresh();
      }
    } else {
      await handleSave();
      setIsDialogOpen(true);
    }
  };

  return (
    <div
      className={`sticky top-0 z-50  transition-all duration-200 ${isMetadataToggle ? "mr-[400px]" : ""}`}
    >
      <nav className="w-full flex flex-row justify-between px-5 py-4">
        <div className="flex flex-row gap-2 items-center">
          <Link
            href={`/${postPlatform?.toLowerCase() || "ratecreator"}`}
            passHref
            className="flex flex-row items-center text-sm rounded-md hover:bg-neutral-300  dark:hover:bg-neutral-700 active:bg-gray-200 p-2"
          >
            <ChevronLeft className="size-4 mr-3" />
            {!postFull
              ? capitalizeFirstLetter(postPlatform)
              : capitalizeFirstLetter(postFull.contentPlatform)}
          </Link>
          <Separator
            orientation="vertical"
            className="h-4 bg-neutral-700 dark:bg-neutral-300"
          />
          <Label className="flex flex-row items-center text-sm font-light text-neutral-600 dark:text-neutral-400  p-2">
            {postId
              ? postFull?.status
                ? capitalizeFirstLetter(postFull.status.toLowerCase())
                : "Draft"
              : "New Post"}
          </Label>
        </div>

        {/* Right-aligned section */}
        <div className="flex flex-row items-center gap-2 mr-2">
          <div className="flex flex-row gap-4 items-center">
            {/* select content type */}

            {!postFull ? (
              <SelectComponent
                items={contentTypes}
                placeholder="blog"
                selectedItem={contentType || postType}
                onSelect={handleSelectContentType}
                showAll={false}
              />
            ) : postFull.status === PostStatus.PUBLISHED ? (
              <Label className="flex flex-row items-center text-md  text-green-600 dark:text-green-500  p-2">
                {capitalizeFirstLetter(postFull.contentType)}
              </Label>
            ) : (
              <SelectComponent
                items={contentTypes}
                placeholder="blog"
                selectedItem={contentType || postType}
                onSelect={handleSelectContentType}
                showAll={false}
              />
            )}

            <Link
              href="/preview"
              passHref
              className="flex flex-row items-center text-sm rounded-md hover:bg-neutral-300  dark:hover:bg-neutral-700 active:bg-gray-200 p-2"
            >
              Preview
            </Link>
            <Button
              onClick={handlePublish}
              variant="link"
              size="sm"
              className={`flex flex-row items-center text-sm rounded-md hover:bg-neutral-700 active:bg-gray-200 p-2 ${
                postFull?.status === PostStatus.PUBLISHED
                  ? "text-red-500"
                  : postFull?.status === PostStatus.SCHEDULED
                    ? "text-blue-500"
                    : "text-green-500"
              }`}
              disabled={isDisabled}
            >
              {postFull?.status === PostStatus.PUBLISHED
                ? "Unpublish"
                : postFull?.status === PostStatus.SCHEDULED
                  ? "Unschedule"
                  : "Publish"}
            </Button>

            <PublishDialog
              value={isDialogOpen}
              onOpenChange={setIsDialogOpen}
            />

            <TooltipProvider>
              <Tooltip>
                <div className="inline-block">
                  {" "}
                  {/* Wrapper div to prevent button nesting */}
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      aria-label="Save post"
                      onClick={handleSave}
                      className="flex z-50 items-center"
                      disabled={isDisabled}
                    >
                      {isSaving && !isSavingSuccess ? (
                        <>
                          <Loader2 className="size-4 mr-1 animate-spin" />
                          Saving...
                        </>
                      ) : savePostError ? (
                        <span className="flex flex-row items-center text-red-500">
                          <AlertTriangle className="size-4 mr-1" />
                          Error
                        </span>
                      ) : !isSaving && !isSavingSuccess && !savePostError ? (
                        <>
                          <Save className="size-4 mr-1" />
                          Save
                        </>
                      ) : (
                        <span className="flex flex-row items-center text-green-500">
                          <Check className="size-4 mr-1" />
                          Saved
                        </span>
                      )}
                    </Button>
                  </TooltipTrigger>
                </div>
                <TooltipContent>
                  {isDisabled && <p>Title and URL are required</p>}
                  {!isDisabled && <p>Click to save</p>}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle sidebar"
            onClick={toggleMetadata}
            className="flex z-50 items-center"
          >
            {!isMetadataToggle && <PanelRightOpen className="size-5" />}
            {isMetadataToggle && <PanelRightClose className="size-5" />}
          </Button>
        </div>
      </nav>
    </div>
  );
};
