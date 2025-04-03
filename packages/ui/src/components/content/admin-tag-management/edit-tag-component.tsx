"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import axios from "axios";

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

import { updateTagAction, deleteTagAction } from "@ratecreator/actions/content";
import { Tags } from "@ratecreator/types/content";
import { SingleImageDropzone } from "@ratecreator/ui/common";
import {
  capitalizeFirstLetter,
  reverseAndHyphenate,
} from "@ratecreator/db/utils";
import { makeFilePublic } from "@ratecreator/actions";
export const EditTagComponent = ({
  id,
  slug,
  description,
  imageUrl,
  posts,
}: Tags) => {
  //   const { slug } = params;
  const router = useRouter();
  const [tagDescription, setTagDescription] = useState(description);
  const tagId = id;
  const [tagImageUrl, setTagImageUrl] = useState(imageUrl);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inputSlug, setInputSlug] = useState(slug);
  const isEmpty = slug === "";
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteTagAction(slug);
    } catch (error) {
      console.error("Failed to delete tag:", error);
    } finally {
      setIsDeleting(false);
      router.push("/tags");
    }
  };

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
      setIsSubmitting(true);
      try {
        // Request presigned URL from the API route
        const { data } = await axios.post("/api/upload", {
          fileType: file.type,
          folderName: "content/tags",
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
        setIsSubmitting(false);
      }
    } else {
      onCloseTagImage();
    }
  };

  const onCloseTagImage = () => {
    setTagImageUrl("");
    setIsSubmitting(false);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError("");

    const result = await updateTagAction({
      id: tagId,
      slug: inputSlug,
      description: tagDescription,
      imageUrl: tagImageUrl,
    });

    setIsSubmitting(false);

    if ("error" in result) {
      // setError(result.error);
      console.error("Error updating tag:", result.error);
    } else {
      // Handle success, e.g., show a notification or redirect
      // alert("Tag updated successfully");
      setInputSlug(result.slug);
      router.push(`/tags/${result.slug}`);
    }
  };

  // const tag = await fetchTagDetails(slug);

  // console.log(tag);

  // //Handle case where blog post is not found
  // if (tag === null) {
  //   notFound();
  // }

  return (
    <div className='m-8  lg:ml-[156px] lg:mr-[156px]'>
      <div className=''>
        <div className='flex flex-row items-center justify-between mb-4 lg:mb-0 '>
          <div>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink
                    href='/tags'
                    className='text-neutral-200 hover:text-neutral-100'
                  >
                    Tags
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className='font-normal text-neutral-500'>
                    Edit tag
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className=' gap-20 justify-start'>
            <Button
              variant='default'
              className='rounded-sm items-center'
              onClick={handleSubmit}
            >
              Save
            </Button>
          </div>
        </div>
      </div>
      <div>
        <Label
          htmlFor=''
          className='text-3xl font-semibold dark:text-neutral-200'
        >
          {capitalizeFirstLetter(inputSlug)}
        </Label>
        <div className='bg-white dark:bg-neutral-900 p-5 rounded-lg mt-5 border border-neutral-200 dark:border-neutral-800'>
          <div className='flex flex-col lg:flex-row gap-6'>
            <div className='w-full lg:w-1/2'>
              <div className='mb-4 space-y-2'>
                <Label
                  htmlFor='SlugName'
                  className='text-[13px] text-neutral-800 dark:text-neutral-200'
                >
                  Slug
                </Label>
                <div className='items-center bg-neutral-100 dark:bg-neutral-800 border-2 border-transparent focus-within:border-green-500 rounded-md'>
                  <input
                    id='SlugName'
                    type='text'
                    value={inputSlug}
                    onChange={handleSlugNameChange}
                    className='h-8 w-full rounded-md text-neutral-800 dark:text-neutral-300 ring-0 focus:ring-0 focus:outline-none bg-neutral-100 dark:bg-neutral-800 px-3 py-2 text-sm file:text-sm file:font-medium placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50'
                  />
                </div>

                {!isEmpty && (
                  <span className='text-[12px] text-neutral-500'>
                    www.ratecreator.com/tags/{inputSlug}/
                  </span>
                )}
                {isEmpty && (
                  <span className='text-[12px] text-neutral-500'>
                    www.ratecreator.com/tags/
                  </span>
                )}
              </div>

              <div className='mt-4 space-y-2'>
                <Label
                  htmlFor='TagDescription'
                  className='text-[13px] text-neutral-800 dark:text-neutral-200'
                >
                  Description
                </Label>
                <Textarea
                  id='TagDescription'
                  value={tagDescription}
                  onChange={handleTagDescriptionChange}
                  className='mt-4 h-8 pl-10 w-full rounded-md text-neutral-800 dark:text-neutral-300 ring-0 focus:ring-0 focus:outline-none px-3 py-2 text-sm file:text-sm file:font-medium placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 bg-neutral-100 dark:bg-neutral-800 border-2 border-transparent focus-within:border-green-500'
                />
                <div className='text-neutral-500 text-[12px]'>
                  Maximum: 500 characters. You've used{" "}
                  <span
                    className={
                      tagDescription?.length === 0 ? "" : "text-green-500"
                    }
                  >
                    {tagDescription?.length}
                  </span>
                  .
                </div>
              </div>
            </div>
            <div className='w-full lg:w-1/2'>
              <Label
                htmlFor='TagImage'
                className='text-sm text-neutral-800 dark:text-neutral-200'
              >
                Tag image
              </Label>
              <SingleImageDropzone
                className='outline-none mt-2'
                disabled={isSubmitting}
                value={tagImageUrl}
                onChange={handleTagImageChange}
              />
            </div>
          </div>
        </div>
        <Button
          variant={"destructive"}
          className='mt-10 text-neutral-200'
          size={"lg"}
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? "Deleting..." : "Delete Tag"}
        </Button>
      </div>
    </div>
  );
};
