"use client";

import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import dynamic from "next/dynamic";
import { useResetRecoilState, useRecoilState, useRecoilValue } from "recoil";
import { useMemo } from "react";

import { UploadComponent } from "@ratecreator/ui/common";
import {
  selectDate,
  postState,
  selectedTimeIst,
  postIdState,
  postDataState,
  tagsState,
  selectedTagsState,
  metadataToggleState,
} from "@ratecreator/store/content";
import { makeFilePublic } from "@ratecreator/actions";
import { MetadataSidebar } from "./metadata-sidebar";
import { useRouter } from "next/navigation";

const NewPostComponent = () => {
  const router = useRouter();
  const isMetadataToggle = useRecoilValue(metadataToggleState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFeatureFileUploadOpen, setIsFeatureFileUploadOpen] = useState(false);
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);

  const [post, setPost] = useRecoilState(postState);

  const resetPost = useResetRecoilState(postState);
  const resetSelectedTimeIst = useResetRecoilState(selectedTimeIst);
  const resetSelectDate = useResetRecoilState(selectDate);
  const resetPostFull = useResetRecoilState(postDataState);
  const resetPostId = useResetRecoilState(postIdState);
  const resetTags = useResetRecoilState(tagsState);
  const resetSelectedTags = useResetRecoilState(selectedTagsState);

  // reset state of all fields and uploaders of this page
  const resetState = () => {
    setIsSubmitting(false);
    setIsFeatureFileUploadOpen(false);
    setAbortController(null);

    resetPostFull();
    resetPost();
    resetSelectedTimeIst();
    resetSelectDate();
    resetPostId();
    resetTags();
    resetSelectedTags();
  };
  useEffect(() => {
    router.refresh();
    resetState();
  }, [
    resetPost,
    resetPostFull,
    resetPostId,
    resetSelectedTimeIst,
    resetSelectDate,
    resetTags,
    resetSelectedTags,
  ]);

  const Editor = useMemo(
    () =>
      dynamic(() => import("../../common/blocknote-editor/editor"), {
        ssr: false,
      }),
    [],
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
    <div className="flex relative min-h-screen">
      <div className="flex-1 transition-all duration-200">
        <div className="mx-auto rounded-md lg:max-w-screen-2xl">
          <div className="ml-10 max-w-screen-md lg:max-w-screen-lg">
            <UploadComponent
              imageUrl={post.featureImage}
              isSubmitting={isSubmitting}
              onChange={handleFeatureImageChange}
              isFileUploadOpen={isFeatureFileUploadOpen}
              toggleFileUpload={toggleFeatureImageUpload}
              text="Add feature image"
              className="text-neutral-400 font-light !no-underline hover:text-neutral-200 mt-10"
              buttonVariant="link"
              onCancel={handleCancelUpload}
            />
          </div>
          <div>
            <input
              value={post.title}
              onChange={handleMainInputChange}
              placeholder="Post title"
              className="w-full ml-12 mt-4 bg-transparent text-5xl font-semibold outline-none ring-0 placeholder:text-neutral-700"
            />
          </div>
          <div className="mt-8">
            <Editor
              onChange={handleEditorContentChange}
              initialContent={post.content}
              editable={true}
            />
          </div>
          {isMetadataToggle && <MetadataSidebar />}
        </div>
      </div>
    </div>
  );
};

export { NewPostComponent };
