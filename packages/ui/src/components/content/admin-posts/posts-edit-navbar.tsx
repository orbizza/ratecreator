"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useRecoilState, useRecoilValue } from "recoil";

import Link from "next/link";

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
} from "@ratecreator/store/content";
import {
  ContentType,
  ContentPlatform,
  PostStatus,
  PostType,
} from "@ratecreator/types/content";
import {
  Button,
  Input,
  Label,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@ratecreator/ui";
import { capitalizeFirstLetter } from "@ratecreator/db/utils";

export const PostsEditNavbar = () => {
  const router = useRouter();

  const postFull = useRecoilValue(postDataState);
  const post = useRecoilValue(postState);
  const [postId, setPostId] = useRecoilState(postIdState);
  const [errorDuplicateUrl, setErrorDuplicateUrl] = useRecoilState(
    errorDuplicateUrlState,
  );

  const savePostError = useRecoilValue(savePostErrorState);

  const [isSaving, setIsSaving] = useState(false);
  const [isSavingSuccess, setIsSavingSuccess] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const isDisabled = post.title === "" || post.postUrl === "";

  const [isMetadataToggle, setIsMetadataToggle] =
    useRecoilState(metadataToggleState);
  const toggleMetadata = () => {
    setIsMetadataToggle((prev) => !prev);
  };

  useEffect(() => {
    if (postFull) {
      setPostId(postFull?.id ?? null);
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
    // const user = await createAuthor();

    // const data: PostType = {
    //   ...post,
    //   authorId: user?.id ?? "",
    //   tags: post.tags,
    // };

    // if (postId) {
    //   const result = await updatePost(data, postId);
    //   setIsSaving(false);
    //   if (result && "error" in result) {
    //     setErrorDuplicateUrl(result.error ?? "Duplicate URL");
    //   } else {
    //     setIsSavingSuccess(true);
    //     setTimeout(() => {
    //       setIsSavingSuccess(false);
    //     }, 3000);
    //     // router.push(`/editor/${postId}`);
    //   }
    // } else {
    //   const result = await createPost(data);
    //   setIsSaving(false);
    //   if (result && "error" in result) {
    //     setErrorDuplicateUrl(result.error ?? "Duplicate URL");
    //   } else if (result && "post" in result && result.post) {
    //     setPostId(result.post.id);
    //     setIsSavingSuccess(true);
    //     setTimeout(() => {
    //       setIsSavingSuccess(false);
    //     }, 3000);
    //     router.push(`/editor/${result.post.id}`);
    //   }
    // }
  };

  const handlePublish = async () => {
    if (isDisabled) return;
    await handleSave();
    setIsDialogOpen(true);
  };

  return (
    <div
      className={`sticky top-0 z-50  transition-all duration-200 ${isMetadataToggle ? "mr-[400px]" : ""}`}
    >
      <nav className="w-full flex flex-row justify-between px-5 py-4">
        <div className="flex flex-row gap-2 items-center">
          <Link
            href="/posts"
            passHref
            className="flex flex-row items-center text-sm rounded-md hover:bg-neutral-300  dark:hover:bg-neutral-700 active:bg-gray-200 p-2"
          >
            <ChevronLeft className="size-4 mr-3" />
            Posts
          </Link>
          <Label className="flex flex-row items-center text-sm font-light text-neutral-600 dark:text-neutral-400  p-2">
            {postId ? "Drafts" : "New Post"}
          </Label>
        </div>

        {/* Right-aligned section */}
        <div className="flex flex-row items-center gap-2 mr-2">
          <div className="flex flex-row gap-4 items-center">
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
              className="flex flex-row items-center text-sm text-green-500 rounded-sm hover:bg-neutral-700 active:bg-gray-200 p-2"
              disabled={isDisabled}
            >
              Publish
            </Button>

            {/* <PublishDialog
              value={isDialogOpen}
              onOpenChange={setIsDialogOpen}
            /> */}

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
