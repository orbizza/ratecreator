"use client";

import React, { useEffect, useState } from "react";
import { Link as LinkIcon, Trash2, Star } from "lucide-react";

import Link from "next/link";
import axios from "axios";
import { useRecoilState } from "recoil";
import { useTheme } from "next-themes";

import {
  selectDate,
  postState,
  selectedTimeIst,
  errorDuplicateUrlState,
  tagsState,
  selectedTagsState,
  savePostErrorState,
  postDataState,
} from "@ratecreator/store/content";

import {
  Label,
  Button,
  Textarea,
  MultiSelect,
  MultiSelectContent,
  MultiSelectGroup,
  MultiSelectItem,
  MultiSelectList,
  MultiSelectSearch,
  MultiSelectTrigger,
  MultiSelectValue,
  Switch,
  Separator,
} from "@ratecreator/ui";

import { DatePicker, UploadComponent } from "@ratecreator/ui/common";

import {
  dateTimeValidation,
  Tags,
  PostStatus,
  ContentPlatform,
  ContentType,
} from "@ratecreator/types/content";

import { fetchAllTagsWithPostCount } from "@ratecreator/actions/content";

import { reverseAndHyphenate } from "@ratecreator/db/utils";

import generateBaseUrl from "./metadata-baseUrl";

export function MetadataSidebar() {
  const [post, setPost] = useRecoilState(postState);
  const [error, setError] = useRecoilState(savePostErrorState);
  const [errorDuplicateUrl, setErrorDuplicateUrl] = useRecoilState(
    errorDuplicateUrlState,
  );
  const [baseUrl, setBaseUrl] = useState("");
  const [inputDate, setInputDate] = useRecoilState(selectDate);
  const [inputTimeIst, setInputTimeIst] = useRecoilState(selectedTimeIst);
  const [selectedTags, setSelectedTags] = useRecoilState(selectedTagsState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMetaImageUploadOpen, setIsMetaImageUploadOpen] = useState(false);
  const { theme } = useTheme();

  const strokeColor = post.featured
    ? "green"
    : theme === "dark"
      ? "white"
      : "black";
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = reverseAndHyphenate(e.target.value);
    const canonicalUrl = baseUrl + "/" + url;
    setPost({ ...post, postUrl: url, canonicalUrl: canonicalUrl });
  };

  const handleExcerptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPost((prev) => ({ ...prev, excerpt: e.target.value }));
  };

  const handleTimeIstChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputTimeIst(e.target.value);
  };

  const handleMetaTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPost((prev) => ({
      ...prev,
      metadataTitle: e.target.value,
    }));
  };

  const handleMetaDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    setPost((prev) => ({
      ...prev,
      metadataDescription: e.target.value,
    }));
  };

  const toggleFeaturePost = () => {
    setPost({ ...post, featured: !post.featured });
  };

  const handleFileUpload = async (file?: File) => {
    if (file) {
      setIsSubmitting(true);
      const controller = new AbortController();
      setAbortController(controller);

      try {
        const { data } = await axios.post(
          "/api/upload",
          {
            fileType: file.type,
            folderName: "content/metadata-images",
          },
          {
            signal: controller.signal,
          },
        );

        const { uploadURL, s3URL } = data;

        await axios.put(uploadURL, file, {
          headers: {
            "Content-Type": file.type,
          },
          signal: controller.signal,
        });

        return s3URL;
      } catch (error) {
        if (axios.isCancel(error)) {
          console.log("Upload cancelled");
        } else {
          console.error("Error uploading file:", error);
        }
      } finally {
        setIsSubmitting(false);
        setAbortController(null);
        closeAllUploaders();
      }
    }
  };

  const handleCancelUpload = () => {
    if (abortController) {
      abortController.abort();
      setIsSubmitting(false);
      setAbortController(null);
    }
  };

  // Separate close handlers for each uploader
  const closeMetaImageUpload = () => {
    setIsMetaImageUploadOpen(false);
    setIsSubmitting(false);
    setPost((prev) => ({ ...prev, metadataImageUrl: "" }));
  };

  // Helper function to close all uploaders
  const closeAllUploaders = () => {
    setIsMetaImageUploadOpen(false);
    setIsSubmitting(false);
  };

  // Modified handlers for each type of upload
  const handleMetaDataImageChange = async (file?: File) => {
    if (!file) {
      closeMetaImageUpload();
      return;
    }
    const url = await handleFileUpload(file);
    setPost((prev) => ({ ...prev, metadataImageUrl: url }));
  };

  useEffect(() => {
    const validateDate = async () => {
      const result = await dateTimeValidation(inputDate, inputTimeIst);

      if (
        (post.status === PostStatus.DRAFT ||
          post.status === PostStatus.SCHEDULED) &&
        result.error
      ) {
        setError(result.error);
      } else {
        setError(null);
        const combinedDate = result.combinedDate as Date;
        setPost({ ...post, publishDate: combinedDate });
      }
    };

    validateDate();
  }, [inputDate, inputTimeIst]);

  useEffect(() => {
    const url = generateBaseUrl(post.contentPlatform, post.contentType);
    setBaseUrl(url);
  }, [post.contentPlatform, post.contentType]);

  useEffect(() => {
    if (errorDuplicateUrl) {
      setTimeout(() => {
        setErrorDuplicateUrl(null);
      }, 5000);
    }
  }, [errorDuplicateUrl]);

  const keywordCount = post.metadataKeywords
    ? post.metadataKeywords
        .split(",")
        .map((k) => k.trim())
        .filter((k) => k.length > 0).length
    : 0;

  const handleTagsChange = (tags: Tags[]) => {
    // First update selectedTags state
    setSelectedTags(tags);

    // Then update post.tags state
    setPost((prevPost) => ({
      ...prevPost,
      tags: tags, // Directly set the new tags instead of appending
    }));
  };

  return (
    <div className=" border-neutral-200 dark:border-neutral-800 w-[400px] fixed right-4 top-[80px] bottom-4 z-40 shadow-lg p-6 overflow-y-auto bg-white dark:bg-neutral-900 transition-all duration-200 rounded-md">
      <h2 className="text-2xl font-semibold mb-4 text-neutral-900 dark:text-white">
        Post settings
      </h2>

      <div className="space-y-4 mt-8">
        <div className="space-y-2">
          <Label
            htmlFor="PostUrl"
            className="text-[13px] text-neutral-900 dark:text-white"
          >
            Post URL
          </Label>
          <div className="flex items-center bg-neutral-50 dark:bg-neutral-800 border-2 border-transparent focus-within:border-green-500 rounded-md">
            <LinkIcon className="dark:text-neutral-400 text-neutral-700 ml-2 size-4" />
            <input
              id="PostUrl"
              type="text"
              placeholder="Post URL"
              value={post.postUrl}
              onChange={handleUrlChange}
              className="flex h-8 w-full rounded-md text-neutral-900 dark:text-neutral-200 ring-0 focus:ring-0 focus:outline-none bg-neutral-50 dark:bg-neutral-800 px-3 py-2 text-sm file:text-sm file:font-medium placeholder:text-neutral-500 dark:placeholder:text-neutral-400 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {!post.postUrl && (
            <span className="text-[12px] text-neutral-500">{baseUrl}/</span>
          )}
          {!errorDuplicateUrl && post.postUrl && (
            <span className="text-[12px] text-neutral-500">
              {baseUrl}/{post.postUrl}/
            </span>
          )}
          {errorDuplicateUrl && (
            <span className="text-red-500 text-sm mt-1">
              {errorDuplicateUrl}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-2 mb-4">
          <Label
            htmlFor="PublishDate"
            className="text-[13px] text-neutral-900 dark:text-white"
          >
            Publish Date
          </Label>
          <div className="flex flex-row items-center">
            <DatePicker date={inputDate} setDate={setInputDate} />
            <div className="flex flex-row items-center group">
              <div className="ml-2 flex items-center bg-neutral-50 dark:bg-neutral-800 group-hover:dark:bg-neutral-900 group-hover:bg-neutral-300 border-none rounded-md">
                <input
                  id="publishTime"
                  type="time"
                  placeholder="17:00"
                  value={inputTimeIst}
                  onChange={handleTimeIstChange}
                  className="flex h-10 w-full rounded-md text-neutral-900 dark:text-neutral-200 ring-0 focus:ring-0 focus:outline-none bg-neutral-50 dark:bg-neutral-800 group-hover:bg-neutral-300 group-hover:dark:bg-neutral-900 px-3 py-2 text-sm file:text-sm file:font-medium placeholder:text-neutral-500 dark:placeholder:text-neutral-400 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <span className="text-neutral-400 dark:text-neutral-500 items-center mr-4 text-[10px]">
                  IST
                </span>
              </div>
            </div>
          </div>
          {error && <span className="text-red-500 text-sm mt-1">{error}</span>}
        </div>

        <div>
          <Label
            htmlFor="Excerpt"
            className="text-[13px] text-neutral-900 dark:text-white"
          >
            Excerpt
          </Label>
          <Textarea
            id="Excerpt"
            placeholder="Write a short description of your post"
            value={post.excerpt}
            onChange={handleExcerptChange}
            className="flex mt-4 h-8 w-full rounded-md text-neutral-900 dark:text-neutral-200 ring-0 focus:ring-0 focus:outline-none px-3 py-2 text-sm file:text-sm file:font-medium placeholder:text-neutral-500 dark:placeholder:text-neutral-400 disabled:cursor-not-allowed disabled:opacity-50 bg-neutral-50 dark:bg-neutral-800 border-2 border-transparent focus-within:border-green-500"
          />
          <div className="text-neutral-500 text-[12px]">
            Recommended: 150 characters. You've used{" "}
            <span
              className={
                post.excerpt.length === 0
                  ? ""
                  : post.excerpt.length <= 250
                    ? "text-green-500"
                    : "text-red-500"
              }
            >
              {post.excerpt.length}
            </span>
            .
          </div>
        </div>
        {/* <div className='mt-4'> */}
        <TagsComponent
          oldSelectedTags={selectedTags}
          newSelectedTags={handleTagsChange}
        />
        {/* </div> */}
        <div className="flex items-center justify-between bg-white dark:bg-neutral-800 p-4 rounded-md border border-neutral-200 dark:border-neutral-600">
          <div className="flex items-center gap-2 h-6">
            <Star
              className="size-5"
              fill={post.featured ? "green" : "transparent"}
              stroke={strokeColor}
            />
            <Label
              htmlFor="feature-post"
              className="text-neutral-700 dark:text-white leading-none"
            >
              Feature this post
            </Label>
          </div>
          <Switch
            id="feature-post"
            checked={post.featured}
            onCheckedChange={toggleFeaturePost}
            className='relative h-6 w-11 cursor-pointer rounded-full data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-neutral-200 dark:data-[state=unchecked]:bg-neutral-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 after:content-[""] after:absolute after:top-[2px] after:left-[2px] after:block after:h-5 after:w-5 after:rounded-full after:bg-black dark:after:bg-white after:transition-transform after:duration-200 data-[state=checked]:after:translate-x-5 data-[state=unchecked]:after:translate-x-0'
          />
        </div>
        <div className="mt-4">
          <Label className="text-2xl font-semibold text-neutral-900 dark:text-white">
            SEO & Social
          </Label>
        </div>
        <Separator className="bg-neutral-200 dark:bg-neutral-700" />
        <div>
          <Label
            htmlFor="SEOKeywords"
            className="text-[13px] text-neutral-700 dark:text-white"
          >
            SEO Keywords
          </Label>
          <Textarea
            id="SEOKeywords"
            placeholder="SEO Keywords"
            value={post.metadataKeywords}
            onChange={(e) =>
              setPost((prev) => ({ ...prev, keywords: e.target.value }))
            }
            className="flex mt-4 h-10 w-full rounded-md text-neutral-900 dark:text-white ring-0 focus:ring-0 focus:outline-none px-3 py-2 text-sm file:text-sm file:font-medium placeholder:text-neutral-500 dark:placeholder:text-neutral-400 disabled:cursor-not-allowed disabled:opacity-50 bg-white dark:bg-neutral-800 border-2 border-neutral-200 dark:border-neutral-700 focus-within:border-green-500"
          />
          <div className="text-neutral-500 dark:text-neutral-400 text-[12px]">
            Recommended: 10 words (Max: 500 characters). <br /> You've used{" "}
            <span
              className={
                keywordCount === 0
                  ? ""
                  : post.metadataKeywords.length <= 100
                    ? "text-green-500"
                    : "text-red-500"
              }
            >
              {keywordCount}
            </span>
            .
          </div>
        </div>
        <div className="space-y-2">
          <Label
            htmlFor="MetaDataTitle"
            className="text-[13px] text-neutral-900 dark:text-white"
          >
            Meta Data Title
          </Label>
          <input
            id="MetaDataTitle"
            type="text"
            placeholder="Meta Data Title"
            value={post.metadataTitle}
            onChange={handleMetaTitleChange}
            className="flex mt-4 h-10 w-full rounded-md text-neutral-900 dark:text-white ring-0 focus:ring-0 focus:outline-none px-3 py-2 text-sm file:text-sm file:font-medium placeholder:text-neutral-500 dark:placeholder:text-neutral-400 disabled:cursor-not-allowed disabled:opacity-50 bg-white dark:bg-neutral-800 border-2 border-neutral-200 dark:border-neutral-700 focus-within:border-green-500"
          />
          <div className="text-neutral-500 dark:text-neutral-400 text-[12px]">
            Recommended: 50 characters. You've used{" "}
            <span
              className={
                post.metadataTitle.length === 0
                  ? ""
                  : post.metadataTitle.length <= 100
                    ? "text-green-500"
                    : "text-red-500"
              }
            >
              {post.metadataTitle.length}
            </span>
            .
          </div>
        </div>
        <div>
          <Label
            htmlFor="MetaDataDescription"
            className="text-[13px] text-neutral-900 dark:text-white"
          >
            Meta Data Description
          </Label>
          <Textarea
            id="MetaDataDescription"
            placeholder="Meta Data Description"
            value={post.metadataDescription}
            onChange={handleMetaDescriptionChange}
            className="flex mt-4 h-10 w-full rounded-md text-neutral-900 dark:text-white ring-0 focus:ring-0 focus:outline-none px-3 py-2 text-sm file:text-sm file:font-medium placeholder:text-neutral-500 dark:placeholder:text-neutral-400 disabled:cursor-not-allowed disabled:opacity-50 bg-white dark:bg-neutral-800 border-2 border-neutral-200 dark:border-neutral-700 focus-within:border-green-500"
          />
          <div className="text-neutral-500 dark:text-neutral-400 text-[12px]">
            Recommended: 160 characters. You've used{" "}
            <span
              className={
                post.metadataDescription.length === 0
                  ? ""
                  : post.metadataDescription.length <= 500
                    ? "text-green-500"
                    : "text-red-500"
              }
            >
              {post.metadataDescription.length}
            </span>
            .
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <Label
            htmlFor="MetaDataImage"
            className="text-[13px] text-neutral-900 dark:text-white mt-4"
          >
            Meta Data Image Upload
          </Label>
          <UploadComponent
            imageUrl={post.metadataImageUrl}
            isSubmitting={isSubmitting}
            onChange={handleMetaDataImageChange}
            isFileUploadOpen={isMetaImageUploadOpen}
            toggleFileUpload={() => setIsMetaImageUploadOpen((prev) => !prev)}
            onCancel={handleCancelUpload}
            text="Add an image"
            buttonVariant="metadata"
          />
        </div>

        <div>
          <Button variant="destructive-outline" className="w-full mt-4">
            <Trash2 className="mr-2 size-4" /> Delete Post
          </Button>
        </div>
      </div>
    </div>
  );
}
interface TagsProps {
  oldSelectedTags: Tags[];
  newSelectedTags: (value: Tags[]) => void;
}

const capitalizeFirstLetter = (item: string) => {
  return item
    .split("-")
    .map((word, index) =>
      index === 0
        ? word.charAt(0).toUpperCase() + word.slice(1)
        : word.toLowerCase(),
    )
    .join(" ");
};

// TagsComponent
export const TagsComponent: React.FC<TagsProps> = ({
  oldSelectedTags,
  newSelectedTags,
}) => {
  const [tags, setTags] = useRecoilState(tagsState);
  const [currentSelectedTags, setCurrentSelectedTags] =
    useState<Tags[]>(oldSelectedTags);
  const [post, setPost] = useRecoilState(postState);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const tagOptions = await fetchAllTagsWithPostCount();
        setTags(tagOptions);
      } catch (error) {
        console.error("Error fetching tags:", error);
      }
    };

    fetchTags();
  }, [setTags]);

  useEffect(() => {
    setCurrentSelectedTags(oldSelectedTags);
  }, [oldSelectedTags]);

  const handleTagChange = (values: string[]) => {
    const updatedTags = values
      .map((tagId) => {
        const tag = tags.find((t) => t.id === tagId);
        if (!tag) return null;
        return {
          id: tag.id,
          slug: tag.slug,
          description: tag.description,
          imageUrl: tag.imageUrl,
          posts: tag.posts,
        };
      })
      .filter((tag): tag is Tags => tag !== null);

    setCurrentSelectedTags(updatedTags);
    newSelectedTags(updatedTags);
  };

  const selectedTagIds = currentSelectedTags.map((tag) => tag.id);

  return (
    <div className="space-y-4">
      <Label className="text-[13px] mb-4 block">Tags</Label>
      <MultiSelect value={selectedTagIds} onValueChange={handleTagChange}>
        <MultiSelectTrigger className="bg-neutral-50 dark:bg-neutral-800 border-2 border-transparent text-neutral-900 dark:text-neutral-200">
          <MultiSelectValue
            className="text-neutral-900 dark:text-neutral-200"
            placeholder="Select tags"
            maxDisplay={2}
          />
        </MultiSelectTrigger>

        <MultiSelectContent className="bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100">
          <MultiSelectSearch
            placeholder="Search tags..."
            className="border-neutral-700 dark:border-neutral-200 text-neutral-900 dark:text-neutral-200"
          />
          <MultiSelectList>
            <MultiSelectGroup>
              {tags.map((tag) => (
                <MultiSelectItem
                  key={tag.id}
                  value={tag.id}
                  className="text-neutral-900 dark:text-neutral-200"
                >
                  {capitalizeFirstLetter(tag.slug)}
                </MultiSelectItem>
              ))}
            </MultiSelectGroup>
          </MultiSelectList>
        </MultiSelectContent>
      </MultiSelect>
    </div>
  );
};
