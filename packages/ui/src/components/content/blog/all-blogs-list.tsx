"use client";

import { format } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import FuzzySearch from "fuzzy-search";
import { fetchAllTagsFromTagOnPost } from "@ratecreator/actions/content";
import { AnimatePresence, motion } from "framer-motion";
import { Tags } from "@ratecreator/types/content";
import { FetchedPostType } from "@ratecreator/types/content";
import { capitalizeFirstLetter, truncateText } from "@ratecreator/db/utils";

export function BlogWithSearch({ blogs }: { blogs: FetchedPostType[] }) {
  return (
    <div className='relative overflow-hidden'>
      <div className='max-w-7xl mx-auto flex flex-col items-center justify-between pb-20'>
        <BlogPostRows blogs={blogs} />
      </div>
    </div>
  );
}

export const BlogPostRows = ({ blogs }: { blogs: FetchedPostType[] }) => {
  const [search, setSearch] = useState("");
  const [allTags, setAllTags] = useState<Record<string, Tags[]>>({});

  const searcher = new FuzzySearch(blogs, ["title", "excerpt", "keywords"], {
    caseSensitive: false,
  });

  const [results, setResults] = useState(blogs);

  useEffect(() => {
    const fetchAllTags = async () => {
      try {
        const allTagsData = await fetchAllTagsFromTagOnPost();
        const tagsByPost: Record<string, Tags[]> = {};

        allTagsData.forEach(
          (tagOnPost: {
            postId: string;
            tag: {
              id: string;
              slug: string;
              description: string | null;
              imageUrl: string | null;
            };
          }) => {
            if (!tagsByPost[tagOnPost.postId]) {
              tagsByPost[tagOnPost.postId] = [];
            }
            tagsByPost[tagOnPost.postId].push({
              id: tagOnPost.tag.id,
              slug: tagOnPost.tag.slug,
              description: tagOnPost.tag.description ?? "",
              imageUrl: tagOnPost.tag.imageUrl ?? "",
              posts: [],
            });
          }
        );

        setAllTags(tagsByPost);
      } catch (error) {
        console.error("Failed to fetch tags:", error);
      }
    };

    fetchAllTags();
  }, []);

  useEffect(() => {
    const results = searcher.search(search);
    setResults(results);
  }, [search]);

  return (
    <div className='w-full py-20'>
      {/* <p className='text-3xl font-bold mb-10'>All Blogs</p> */}
      <div className='flex md:flex-row flex-col justify-between gap-4 md:items-center mb-4 mx-auto ml-10 mr-10'>
        <p className='text-3xl font-bold sm:w-1/3'>All Blogs</p>
        <input
          type='text'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder='Search Blogs'
          className='text-sm w-full sm:min-w-96 border dark:border-transparent border-yellow-200 p-2 rounded-md dark:bg-neutral-800 bg-white shadow-sm focus:border-yellow-400 focus:ring-0 focus:outline-none outline-none text-neutral-700 dark:text-neutral-200 dark:placeholder-neutral-400 placeholder:neutral-700 '
        />
      </div>

      <div className='ml-10 mr-10'>
        {results.length === 0 ? (
          <p className='text-neutral-400 text-center p-4'>No results found</p>
        ) : (
          results.map((blog, index) => (
            <BlogPostRow
              blog={blog}
              key={blog.postUrl + index}
              tags={allTags[blog.id] || []}
            />
          ))
        )}
      </div>
    </div>
  );
};

export const BlogPostRow = ({
  blog,
  tags,
}: {
  blog: FetchedPostType;
  tags: Tags[];
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link
      href={`/blog/${blog.postUrl}`}
      key={`${blog.postUrl}`}
      className='relative block'
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <AnimatePresence>
        {isHovered && (
          <motion.span
            className='absolute inset-0 h-full w-full bg-neutral-200 dark:bg-slate-800/[0.8] block rounded-lg'
            layoutId='hoverBackground'
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              transition: { duration: 0.15 },
            }}
            exit={{
              opacity: 0,
              transition: { duration: 0.15, delay: 0.2 },
            }}
          />
        )}
      </AnimatePresence>
      <div className='flex md:flex-row flex-col items-start justify-between md:items-center group/blog-row py-4 px-4 relative z-10 '>
        <div>
          <p className='text-lg font-medium transition duration-200'>
            {blog.title}
          </p>
          {blog.excerpt && (
            <p className='text-neutral-600 dark:text-neutral-400 text-sm mt-2 max-w-xl transition duration-200'>
              {truncateText(blog.excerpt, 100)}
            </p>
          )}

          <div className='flex flex-col sm:flex-row-reverse gap-2 justify-end items-center'>
            {
              <div className='flex flex-wrap gap-2 my-2 sm:my-4 items-center'>
                {tags.map((tag) => (
                  <span
                    key={tag.id}
                    className='px-2 py-1 text-xs font-medium bg-neutral-200 text-neutral-800 rounded-md'
                  >
                    {capitalizeFirstLetter(tag.slug)}
                  </span>
                ))}
              </div>
            }

            <div className='flex gap-2 items-center my-2 sm:my-4'>
              <p className='text-neutral-500 dark:text-neutral-400 text-xs max-w-xl transition duration-200'>
                {blog.publishDate
                  ? format(new Date(blog.publishDate), "MMMM dd, yyyy")
                  : ""}
              </p>
            </div>
            <Image
              src={blog.author.imageUrl}
              alt={blog.author.name}
              width={40}
              height={40}
              className=' block md:hidden rounded-full md:h-10 md:w-10 h-6 w-6 mt-0 object-cover'
            />
          </div>
        </div>
        <Image
          src={blog.author.imageUrl}
          alt={blog.author.name}
          width={40}
          height={40}
          className=' hidden md:block rounded-full md:h-10 md:w-10 h-6 w-6 mt-2 md:mt-0 object-cover'
        />
      </div>
    </Link>
  );
};
