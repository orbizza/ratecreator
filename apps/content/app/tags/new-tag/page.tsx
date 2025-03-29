"use client";

import { useState } from "react";

import {
  Button,
  Label,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Textarea,
} from "@ratecreator/ui";

import { createTagAction } from "@ratecreator/actions/content";

import { useRouter } from "next/navigation";
import { SingleImageDropzone } from "@ratecreator/ui/common";
import { reverseAndHyphenate } from "@ratecreator/db/utils";
import axios from "axios";
import { makeFilePublic } from "@ratecreator/actions";
const NewTag = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inputSlug, setInputSlug] = useState("");
  const [tagImageUrl, setTagImageUrl] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [tagDescription, setTagDescription] = useState("");

  const [slugError, setSlugError] = useState("");
  const [descriptionError, setDescriptionError] = useState("");

  const router = useRouter();

  const handleSlugNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputSlug(reverseAndHyphenate(e.target.value));
  };

  const handleTagDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setTagDescription(e.target.value);
  };

  const handleTagImageChange = async (file?: File) => {
    if (file) {
      setIsUploadingImage(true);
      try {
        // Request presigned URL from the API route
        const { data } = await axios.post("/api/upload", {
          fileType: file.type,
          folderName: "tags",
        });

        const { uploadURL, s3URL, fileName } = data;

        await axios.put(uploadURL, file, {
          headers: {
            "Content-Type": file.type,
          },
        });
        await makeFilePublic(fileName);
        setTagImageUrl(s3URL);
      } catch (error) {
        console.error("Error uploading file:", error);
      } finally {
        setIsUploadingImage(false);
      }
    } else {
      onCloseTagImage();
    }
  };

  const onCloseTagImage = () => {
    setTagImageUrl("");
  };

  const handleSave = async () => {
    if (isUploadingImage) {
      console.log("Please wait for image upload to complete");
      return;
    }

    setIsSubmitting(true);
    setSlugError("");
    setDescriptionError("");

    try {
      const result = await createTagAction({
        slug: inputSlug,
        description: tagDescription,
        imageUrl: tagImageUrl,
      });

      if (result.success) {
        console.log("Tag created successfully:", result);
        router.push(`/tags/${inputSlug}`);
      } else {
        console.error("Failed to create tag:", result);
      }
    } catch (error) {
      console.error("Error creating tag:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='m-4 md:m-8 mx-auto lg:max-w-3xl'>
      <div className='mb-5'>
        <div className='flex flex-row items-center justify-between md:justify-end mb-4'>
          <Breadcrumb className='block md:hidden'>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink
                  href='/tags'
                  className='text-neutral-800 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-neutral-100'
                >
                  Tags
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className='font-normal text-neutral-500'>
                  New tag
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <Button
            variant='outline'
            onClick={handleSave}
            disabled={isSubmitting || !inputSlug.trim() || isUploadingImage}
          >
            {isUploadingImage
              ? "Uploading image..."
              : isSubmitting
                ? "Saving..."
                : "Save"}
          </Button>
        </div>
        <h1 className='text-3xl font-semibold text-neutral-800 dark:text-neutral-200'>
          New tag
        </h1>
      </div>

      <div className='bg-white dark:bg-neutral-900 rounded-lg p-4 lg:p-6 border border-neutral-200 dark:border-neutral-800'>
        <div className='flex flex-col lg:flex-row!important lg:overflow-hidden gap-6'>
          <div className='space-y-4'>
            <div className='space-y-2'>
              <Label
                htmlFor='SlugName'
                className='text-sm text-neutral-800 dark:text-neutral-200'
              >
                Slug
              </Label>
              <input
                id='SlugName'
                type='text'
                value={inputSlug}
                onChange={handleSlugNameChange}
                className={`w-full h-10 rounded-md text-neutral-800 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 px-3 py-2 text-sm border-2 ${
                  slugError ? "border-red-500" : "border-transparent"
                } focus:border-green-500 focus:outline-none`}
              />
              <span className='text-xs text-neutral-500'>
                www.ratecreator.com/tags/{inputSlug || ""}
              </span>
              {slugError && (
                <div className='text-red-500 text-sm mt-1'>{slugError}</div>
              )}
            </div>

            <div className='space-y-2'>
              <Label
                htmlFor='TagDescription'
                className='text-sm text-neutral-800 dark:text-neutral-200'
              >
                Description
              </Label>
              <Textarea
                id='TagDescription'
                value={tagDescription}
                onChange={handleTagDescriptionChange}
                className={`w-full min-h-[100px] rounded-md text-neutral-800 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 px-3 py-2 text-sm border-2 ${
                  descriptionError ? "border-red-500" : "border-transparent"
                } focus:border-green-500 focus:outline-none`}
              />
              <div className='text-xs text-neutral-500'>
                Maximum: 500 characters. You&apos;ve used{" "}
                <span
                  className={
                    tagDescription.length === 0 ? "" : "text-green-500"
                  }
                >
                  {tagDescription.length}
                </span>
                .
              </div>
              {descriptionError && (
                <div className='text-red-500 text-sm mt-1'>
                  {descriptionError}
                </div>
              )}
            </div>
          </div>

          <div className=''>
            <Label
              htmlFor='TagImage'
              className='text-sm text-neutral-800 dark:text-neutral-200 mb-2 block'
            >
              Tag image
            </Label>
            <SingleImageDropzone
              className='w-full h-[200px] outline-none'
              disabled={isUploadingImage}
              value={tagImageUrl}
              onChange={handleTagImageChange}
            />
            {isUploadingImage && (
              <div className='text-sm text-neutral-400 mt-2'>
                Uploading image...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewTag;
