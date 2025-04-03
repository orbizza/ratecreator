"use client";

import { fetchTagsFromTagOnPost } from "@ratecreator/actions/content";
import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import dynamic from "next/dynamic";
import { useRecoilState, useRecoilValue } from "recoil";

import { UploadComponent } from "@ratecreator/ui/common";
import {
  selectDate,
  postState,
  selectedTimeIst,
  selectedTagsState,
  postDataState,
  postIdState,
  metadataToggleState,
} from "@ratecreator/store/content";
import { Tags } from "@ratecreator/types/content";
import { usePathname } from "next/navigation";
import { MetadataSidebar } from "./metadata-sidebar";
import { FetchedPostType } from "@ratecreator/types/content";
import { makeFilePublic } from "@ratecreator/actions";

export const EditContentPost = ({
  initialPost,
}: {
  initialPost: FetchedPostType;
}) => {
  const pathname = usePathname();

  // Recoil States
  const [postFull, setPostFull] = useRecoilState(postDataState);
  const [post, setPost] = useRecoilState(postState);
  const [postId, setPostId] = useRecoilState(postIdState);
  const [inputDate, setInputDate] = useRecoilState(selectDate);
  const [inputTimeIst, setInputTimeIst] = useRecoilState(selectedTimeIst);

  // Local States
  const isMetadataToggle = useRecoilValue(metadataToggleState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFeatureFileUploadOpen, setIsFeatureFileUploadOpen] = useState(false);
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);
  const [tags, setTags] = useState<Tags[]>([]);
  const [selectedTags, setSelectedTags] = useRecoilState(selectedTagsState);

  const resetState = () => {
    setIsSubmitting(false);
    setIsFeatureFileUploadOpen(false);
    setAbortController(null);
  };

  useEffect(() => {
    resetState();
  }, []);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const tagOptions = await fetchTagsFromTagOnPost({
          postId: initialPost.id,
        });
        // console.log("Fetched tags:", tagOptions);
        setTags(
          tagOptions.map((tag) => ({
            id: tag.tag.id,
            description: tag.tag.description ?? "",
            imageUrl: tag.tag.imageUrl ?? "",
            slug: tag.tag.slug,
            posts: tag.tag.posts,
          }))
        );
      } catch (error) {
        console.error("Error fetching tags:", error);
      }
    };

    fetchTags();
  }, [setTags]);

  useEffect(() => {
    if (pathname.includes("/editor/")) {
      setPostFull(initialPost);

      const initializeDateAndTime = (publishDate: Date) => {
        // Extract the date portion
        setInputDate(publishDate);

        // Extract the time portion in HH:mm format

        const istTime = new Date(publishDate.getTime() + 5.5 * 60 * 60 * 1000);
        const hours = istTime.getUTCHours().toString().padStart(2, "0");
        const minutes = istTime.getUTCMinutes().toString().padStart(2, "0");
        const formattedTime = `${hours}:${minutes}`;
        setInputTimeIst(formattedTime);
        // console.log("formattedTime", formattedTime);
      };

      initializeDateAndTime(initialPost.publishDate || new Date());

      setPost({
        title: initialPost.title,
        content: initialPost.content,
        featureImage: initialPost.featureImage || "",
        postUrl: initialPost.postUrl,
        publishDate: initialPost.publishDate,
        excerpt: initialPost.excerpt,
        featured: initialPost.isFeatured,
        tags: tags,
        authors: initialPost.author?.id || "",
        contentPlatform: initialPost.contentPlatform,
        contentType: initialPost.contentType,
        status: initialPost.status,
        createdAt: initialPost.createdAt,
        updatedAt: initialPost.updatedAt,
        canonicalUrl: initialPost.canonicalUrl || "",
        metadataTitle: initialPost.metadataTitle || "",
        metadataDescription: initialPost.metadataDescription || "",
        metadataImageUrl: initialPost.metadataImageUrl || "",
        metadataKeywords: initialPost.metadataKeywords || "",
      });

      setSelectedTags(post.tags);

      setPostId(initialPost.id);
    }
  }, [
    initialPost,
    setPostFull,
    setPost,
    tags,
    setPostId,
    setTags,
    pathname,
    setSelectedTags,
    setInputDate,
    setInputTimeIst,
  ]);

  const Editor = useMemo(
    () =>
      dynamic(() => import("../../common/blocknote-editor/editor"), {
        ssr: false,
      }),
    []
  );

  const handleEditorContentChange = (content: string) => {
    setPost((prev) => ({ ...prev, content }));
  };

  const toggleFeatureImageUpload = () => {
    setIsFeatureFileUploadOpen((prev) => !prev);
  };

  const handleMainInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPost((prev) => ({ ...prev, title: e.target.value }));
  };

  const handleFeatureImageChange = async (file?: File) => {
    if (file) {
      setIsSubmitting(true);
      try {
        const { data } = await axios.post("/api/upload", {
          fileType: file.type,
          folderName: "content/feature-images",
        });
        const { uploadURL, s3URL, fileName } = data;
        await axios.put(uploadURL, file, {
          headers: { "Content-Type": file.type },
        });
        setPost((prev) => ({
          ...prev,
          featureImage: s3URL,
          metadataImageUrl: s3URL,
        }));
        await makeFilePublic(fileName);
      } catch (error) {
        console.error("Error uploading file:", error);
      } finally {
        setIsSubmitting(false);
        setAbortController(null);
        setIsFeatureFileUploadOpen(false);
      }
    } else {
      onCloseFeatureImage();
    }
  };

  const handleCancelUpload = () => {
    if (abortController) {
      abortController.abort();
      setIsSubmitting(false);
      setAbortController(null);
    }
  };

  const onCloseFeatureImage = () => {
    setPost((prev) => ({ ...prev, featureImage: "" }));
    setIsSubmitting(false);
    setIsFeatureFileUploadOpen(false);
  };

  return (
    <div className='flex relative min-h-screen'>
      <div className='flex-1 transition-all duration-200'>
        <div className='mx-auto rounded-md lg:max-w-screen-2xl'>
          <div className='ml-10 max-w-screen-md lg:max-w-screen-lg'>
            <UploadComponent
              imageUrl={post.featureImage}
              isSubmitting={isSubmitting}
              onChange={handleFeatureImageChange}
              isFileUploadOpen={isFeatureFileUploadOpen}
              toggleFileUpload={toggleFeatureImageUpload}
              text='Add feature image'
              className='text-neutral-400 font-light !no-underline hover:text-neutral-200 mt-10'
              buttonVariant='link'
              onCancel={handleCancelUpload}
            />
          </div>
          <div>
            <input
              value={post.title}
              onChange={handleMainInputChange}
              placeholder='Post title'
              className='w-full ml-12 mt-4 bg-transparent text-5xl font-semibold outline-none ring-0 placeholder:text-neutral-700'
            />
          </div>
          <div className='mt-8'>
            <Editor
              onChange={handleEditorContentChange}
              initialContent={post.content}
              editable={true}
            />
          </div>
        </div>
      </div>

      {isMetadataToggle && <MetadataSidebar />}
    </div>
  );
};
