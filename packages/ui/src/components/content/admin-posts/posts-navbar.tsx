"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useRecoilState } from "recoil";
import {
  contentTypeAtom,
  contentPlatformAtom,
  postStatusAtom,
} from "@ratecreator/store/content";
import {
  ContentType,
  ContentPlatform,
  PostStatus,
} from "@ratecreator/types/content";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  Button,
} from "@ratecreator/ui";
import { capitalizeFirstLetter } from "@ratecreator/db/utils";
import Link from "next/link";

export const PostsNavbar = () => {
  const allPosts = [
    "all-posts",
    "draft",
    "featured",
    "published",
    "scheduled",
    "deleted",
  ];
  const pathname = usePathname();
  const [contentType, setContentType] = useRecoilState(contentTypeAtom);
  const [contentPlatformType, setContentPlatformType] =
    useRecoilState(contentPlatformAtom);
  const [postStatus, setPostStatus] = useRecoilState(postStatusAtom);

  useEffect(() => {
    const pathSegments = pathname.split("/").filter(Boolean);

    // Handle single segment (just platform)
    if (pathSegments.length === 1) {
      const platform = pathSegments[0].toUpperCase() as ContentPlatform;
      setContentPlatformType(platform);
      setContentType(ContentType.ALL);
      return;
    }

    // Handle platform and content type
    if (pathSegments.length >= 2) {
      const platform = pathSegments[0].toUpperCase() as ContentPlatform;
      const contentType = pathSegments[1].toUpperCase() as ContentType;

      setContentPlatformType(platform);
      setContentType(contentType);
    }
  }, [pathname, setContentType, setContentPlatformType]);

  const currentPostType = pathname.split("/").pop();

  const isCurrentPostType = (type: string) => {
    return currentPostType === type;
  };

  return (
    <>
      {/* mobile screen */}
      <div className="flex md:hidden flex-col gap-4 justify-end mr-4">
        <div className="flex justify-end">
          <Link href="/new-post" className="mr-4">
            <Button variant="outline">New post</Button>
          </Link>
        </div>
        <div className="flex flex-row gap-2 justify-between mr-4 ">
          <div className="">
            {/* <SelectComponent
          items={postFilter}
          placeholder='all-posts'
          onSelect={onSelectPostOption}
          selectedItem={postOption}
        /> */}
          </div>
          <div className="mr-1 text-sm md:text-sm">
            {capitalizeFirstLetter(contentType)}
          </div>
          <div className="mr-1 text-sm md:text-sm">
            {/* {capitalizeFirstLetter(postStatus)} */}
            Status
          </div>
          <div className="mr-1 text-sm md:text-sm ">All authors</div>
          <div className="mr-1 text-sm md:text-sm ">Tags</div>
          {/* <div className='mr-1'>
          <SelectComponent
          items={tags}
          placeholder='all-tags'
          onSelect={onSelectTagOption}
          selectedItem={tagOption}
        />
        </div> */}
          <div className="mr-1 text-sm md:text-sm">Newest first</div>
        </div>
      </div>

      {/* md screen */}
      <div className="hidden md:flex flex-col md:flex-row gap-2 md:gap-8 justify-end mr-4 items-center">
        <div className="">
          {/* <SelectComponent
          items={postFilter}
          placeholder='all-posts'
          onSelect={onSelectPostOption}
          selectedItem={postOption}
        /> */}
        </div>
        <div className="mr-1 text-sm md:text-sm">
          {capitalizeFirstLetter(contentType)}
        </div>
        <div className="mr-1 text-sm md:text-sm">
          {/* {capitalizeFirstLetter(postStatus)} */}
          Status
        </div>
        <div className="mr-1 text-sm md:text-sm ">All authors</div>
        <div className="mr-1 text-sm md:text-sm ">Tags</div>
        {/* <div className='mr-1'>
          <SelectComponent
          items={tags}
          placeholder='all-tags'
          onSelect={onSelectTagOption}
          selectedItem={tagOption}
        />
        </div> */}
        <div className="mr-1 text-sm md:text-sm">Newest first</div>

        <Link href="/new-post" className="mr-4">
          <Button variant="outline">New post</Button>
        </Link>
      </div>
    </>
  );
};

interface SelectComponentProps {
  placeholder: string;
  items: string[];
  onSelect: (item: string) => void;
  selectedItem: string;
}

const SelectComponent = ({
  placeholder,
  items,
  onSelect,
  selectedItem,
}: SelectComponentProps) => {
  const handleSelect = (item: string) => {
    onSelect(item);
  };

  return (
    <Select onValueChange={handleSelect}>
      <div
        className={`${
          selectedItem && selectedItem !== placeholder
            ? "text-green-500 bg-neutral-800 rounded-sm"
            : "text-neutral-200"
        }`}
      >
        <SelectTrigger className="ml-2 bg-transparent border-transparent ring-0 outline-none focus:ring-0 focus:outline-none  text-sm md:text-sm">
          {capitalizeFirstLetter(selectedItem) ||
            capitalizeFirstLetter(placeholder)}
        </SelectTrigger>{" "}
      </div>
      <SelectContent className="pl-0 bg-neutral-800 border-transparent ring-0 outline-none focus:ring-0 focus:outline-none">
        <SelectGroup className="pl-0 bg-neutral-800 ">
          {items.map((item) => (
            <SelectItem
              key={item}
              className="text-neutral-200 border-transparent hover:bg-neutral-950 hover:text-neutral-200 text-sm md:text-sm font-light !justify-start focus:ring-0 focus:outline-none focus:bg-neutral-950 focus:text-neutral-200 pr-5 "
              value={item}
              onClick={() => handleSelect(item)}
            >
              {capitalizeFirstLetter(item)}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};
