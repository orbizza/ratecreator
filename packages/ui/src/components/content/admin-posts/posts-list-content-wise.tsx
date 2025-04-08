"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useRecoilState, useResetRecoilState, useRecoilValue } from "recoil";

import { Separator } from "@ratecreator/ui";
import {
  contentPageNumberState,
  contentTypeAtom,
  contentPlatformAtom,
  postListTagsState,
  postStatusAtom,
} from "@ratecreator/store/content";
import {
  fetchAllPosts,
  fetchAllPostsCount,
} from "@ratecreator/actions/content";

import PostsTableRender from "./posts-table-render";
import { FetchedPostType } from "@ratecreator/types/content";
import { PaginationBar } from "../../review/cards/pagination-bar";
import { ContentType, ContentPlatform } from "@ratecreator/types/content";

const PostsListContentWise = () => {
  const [posts, setPosts] = useState<FetchedPostType[]>([]);
  const [loading, setLoading] = useState(false);

  const [currentPage, setCurrentPage] = useRecoilState(contentPageNumberState);
  const tagValue = useRecoilValue(postListTagsState);
  const postStatus = useRecoilValue(postStatusAtom);
  const contentType = useRecoilValue(contentTypeAtom);
  const platformType = useRecoilValue(contentPlatformAtom);

  const resetPageNumber = useResetRecoilState(contentPageNumberState);
  const resetPostListTags = useResetRecoilState(postListTagsState);
  const resetPostStatus = useResetRecoilState(postStatusAtom);
  const resetContentType = useResetRecoilState(contentTypeAtom);
  const resetPlatformType = useResetRecoilState(contentPlatformAtom);

  useEffect(() => {
    resetPageNumber();
    resetPostListTags();
    resetPostStatus();
    resetPlatformType();
  }, [resetPageNumber, resetPostListTags, resetPostStatus, resetPlatformType]);

  const [postsCount, setPostsCount] = useState(0);

  const fetchPosts = async () => {
    try {
      const fetchedPosts = await fetchAllPosts(
        tagValue,
        currentPage,
        contentType?.toString().toLowerCase(),
        platformType.toString().toLowerCase(),
        postStatus?.toString().toLowerCase(),
      );

      setPosts(fetchedPosts as FetchedPostType[]);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPostsCount = async () => {
    try {
      setLoading(true);
      const fetchedPostsCount = await fetchAllPostsCount(
        tagValue,
        contentType?.toString().toLowerCase(),
        platformType.toString().toLowerCase(),
        postStatus?.toString().toLowerCase(),
      );
      setPostsCount(fetchedPostsCount);
    } catch (error) {
      console.error("Error fetching posts count:", error);
    }
  };

  useEffect(() => {
    fetchPostsCount();
    fetchPosts();
  }, [contentType, platformType, currentPage, postStatus, tagValue]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="m-8 w-full max-w-7xl mx-auto">
      <Separator className="bg-neutral-500 h-[1px] mb-4" />
      {loading ? (
        <div className="flex flex-row items-center justify-center h-screen-1/2">
          <Loader2 className="size-10 animate-spin" />
        </div>
      ) : (
        <PostsTableRender posts={posts} />
      )}
      {loading ? (
        <> </>
      ) : postsCount > 0 ? (
        <PaginationBar
          currentPage={currentPage}
          totalPages={Math.ceil(postsCount / 10)}
          onPageChange={handlePageChange}
          totalItems={postsCount}
          itemsPerPage={10}
        />
      ) : (
        <div className="flex flex-row mt-10 items-start justify-center h-screen-1/2">
          <p className="text-3xl text-red-700">No posts found</p>
        </div>
      )}
    </div>
  );
};

export { PostsListContentWise };
