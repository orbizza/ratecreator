"use client";

import { useState } from "react";
import { useEffect } from "react";
import { contentPageNumberState } from "@ratecreator/store/content";
import {
  fetchPublishedPosts,
  fetchPublishedPostsCount,
} from "@ratecreator/actions/content";
import { useRecoilState, useResetRecoilState } from "recoil";
import { PaginationBar } from "@ratecreator/ui/review";
import { BlogWithSearch } from "./all-blogs-list";
import { SimpleBlogWithGrid } from "./featured-blogs-grid";
import { FetchedPostType } from "@ratecreator/types/content";
import ArticlesListingSkeleton from "../content-skeletons/skeleton-blog-listing";

export const BlogsListPage = () => {
  const [posts, setPosts] = useState<FetchedPostType[]>([]);
  const [featuredPosts, setFeaturedPosts] = useState<FetchedPostType[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useRecoilState(contentPageNumberState);
  const resetPageNumber = useResetRecoilState(contentPageNumberState);
  const [postsCount, setPostsCount] = useState(0);

  const fetchPostsCount = async () => {
    try {
      const freshCount = await fetchPublishedPostsCount("blogs");

      setPostsCount(freshCount);
    } catch (error) {
      console.error("BlogsListPage: Error in fetchPostsCount:", error);
    }
  };

  const fetchPosts = async ({
    option,
    setPosts,
  }: {
    option: string;
    setPosts: (posts: FetchedPostType[]) => void;
  }) => {
    try {
      const freshPosts = await fetchPublishedPosts(option);

      if (Array.isArray(freshPosts) && freshPosts.length > 0) {
        setPosts(freshPosts);
      }
    } catch (error) {
      console.error(`BlogsListPage: Error in fetchPosts for ${option}:`, error);
    }
  };

  const fetchAllPosts = async () => {
    setLoading(true);

    try {
      await fetchPostsCount();

      await fetchPosts({ option: "blogs", setPosts: setPosts });
      await fetchPosts({
        option: "featured-posts",
        setPosts: setFeaturedPosts,
      });
    } catch (error) {
      console.error("Error in fetchAllPosts:", error);
    } finally {
      setLoading(false);
    }
  };

  // Ensure the effect only runs once
  useEffect(() => {
    fetchAllPosts();
  }, []);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className='max-w-6xl mx-auto items-center justify-between pb-20'>
      {loading ? (
        <div className='flex flex-row mt-10 items-center justify-center '>
          {/* <Loader2 className="size-16 animate-spin" /> */}
          <ArticlesListingSkeleton />
        </div>
      ) : postsCount > 0 ? (
        <>
          <SimpleBlogWithGrid blogs={featuredPosts} />
          <BlogWithSearch blogs={posts} />
          {/* ToDo: Enable pagination when a lot of blogs are added and algolia search is added */}
          {/* <PaginationBar
            currentPage={currentPage}
            totalPages={Math.ceil(postsCount / 10)}
            onPageChange={handlePageChange}
          /> */}
        </>
      ) : (
        <div className='flex flex-row mt-10 items-start justify-center h-screen-1/2'>
          <p className='text-3xl text-red-700'>No blogs found</p>
        </div>
      )}
    </div>
  );
};
