"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

import { cn } from "@ratecreator/ui/utils";

import { FetchedPostType } from "@ratecreator/types/content";
import { truncateText } from "@ratecreator/db/utils";

export function SimpleBlogWithGrid({ blogs }: { blogs: FetchedPostType[] }) {
  return (
    <div className="relative overflow-hidden mx-auto max-w-6xl">
      <div className=" overflow-hidden relative ">
        {blogs.length > 0 && (
          <div className="relative sm:mt-20">
            <h1
              className={cn(
                "scroll-m-20 text-3xl font-bold text-left tracking-tight text-black dark:text-white mb-6 ml-10",
              )}
            >
              Featured Blogs
            </h1>
          </div>
        )}
      </div>
      <div className="hidden md:flex flex-col items-center justify-between pb-10 max-w-6xl  mx-auto gap-4 p-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full relative">
          {blogs.length > 0 ? (
            blogs
              .slice(0, 2)
              .map((blog, index) => (
                <BlogCard blog={blog} key={blog.postUrl + index} />
              ))
          ) : (
            <></>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full relative">
          {blogs.length > 2 ? (
            blogs
              .slice(2, 5)
              .map((blog, index) => (
                <BlogCard blog={blog} key={blog.postUrl + index} />
              ))
          ) : (
            <></>
          )}
        </div>
      </div>
      <div className="flex md:hidden flex-col items-center justify-between pb-10 max-w-6xl  mx-auto gap-4 p-10">
        <div className="grid grid-cols-1 gap-4 w-full relative">
          {blogs.length > 0 ? (
            blogs
              .slice(0, 2)
              .map((blog, index) => (
                <BlogCard blog={blog} key={blog.postUrl + index} />
              ))
          ) : (
            <></>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4 w-full relative">
          {blogs.length > 2 ? (
            blogs
              .slice(2, 4)
              .map((blog, index) => (
                <BlogCard blog={blog} key={blog.postUrl + index} />
              ))
          ) : (
            <></>
          )}
        </div>
        <div className="grid grid-cols-1 gap-4 w-full relative">
          {blogs.length > 4 ? (
            blogs
              .slice(4, 5)
              .map((blog, index) => (
                <BlogCard blog={blog} key={blog.postUrl + index} />
              ))
          ) : (
            <></>
          )}
        </div>
      </div>
    </div>
  );
}

const Logo = () => {
  return (
    <Link
      href="/"
      className="font-normal flex space-x-2 items-center text-sm mr-4  text-black px-2 py-1  relative"
    >
      <div className="h-5 w-6 bg-black dark:bg-white rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm" />
      <span className="font-medium text-black dark:text-white">
        Shaswat Deep
      </span>
    </Link>
  );
};

export const BlogCard = ({ blog }: { blog: FetchedPostType }) => {
  return (
    <Link
      className="shadow-derek rounded-3xl border dark:border-neutral-800 w-full bg-white dark:bg-neutral-900  overflow-hidden  hover:scale-[1.02] transition duration-200"
      href={`/blog/${blog.postUrl}`}
    >
      {blog.featureImage ? (
        <BlurImage
          src={blog.featureImage || ""}
          alt={blog.title}
          height="800"
          width="800"
          className="h-52 object-cover object-top w-full"
        />
      ) : (
        <div className="h-52 flex items-center justify-center bg-white dark:bg-neutral-900">
          <Logo />
        </div>
      )}
      <div className="p-4 md:p-8 bg-white dark:bg-neutral-900">
        <div className="flex space-x-2 items-center mb-2">
          <Image
            src={blog.author.imageUrl || ""}
            alt={blog.author.name}
            width={20}
            height={20}
            className="rounded-full h-5 w-5"
          />
          <p className="text-sm font-normal text-neutral-600 dark:text-neutral-400">
            {blog.author.name}
          </p>
        </div>
        <p className="hidden sm:block text-lg font-bold mb-4 text-neutral-800 dark:text-neutral-100">
          {blog.title}
        </p>
        <p className="block sm:hidden text-lg font-bold mb-4 text-neutral-800 dark:text-neutral-100">
          {truncateText(blog.title, 30)}
        </p>
        {/* <p className='text-left text-sm mt-2 text-neutral-600 dark:text-neutral-400'>
          {truncate(blog.excerpt, 100)}
        </p> */}
      </div>
    </Link>
  );
};

interface IBlurImage {
  height?: any;
  width?: any;
  src?: string | any;
  objectFit?: any;
  className?: string | any;
  alt?: string | undefined;
  layout?: any;
  [x: string]: any;
}

export const BlurImage = ({
  height,
  width,
  src,
  className,
  objectFit,
  alt,
  layout,
  ...rest
}: IBlurImage) => {
  const [isLoading, setLoading] = useState(true);
  return (
    <Image
      className={cn(
        "transition duration-300 transform",
        isLoading ? "blur-sm scale-105" : "blur-0 scale-100",
        className,
      )}
      src={src}
      width={width}
      height={height}
      loading="lazy"
      decoding="async"
      blurDataURL={src}
      layout={layout}
      alt={alt ? alt : "Avatar"}
      {...rest}
      onLoad={() => setLoading(false)}
    />
  );
};
