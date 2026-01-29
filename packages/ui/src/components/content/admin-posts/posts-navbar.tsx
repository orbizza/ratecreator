"use client";

import { useEffect } from "react";
import { useRecoilState } from "recoil";
import {
  contentTypeAtom,
  postStatusAtom,
  listOfTagsState,
  postListTagsState,
} from "@ratecreator/store/content";
import { ContentType, PostStatus } from "@ratecreator/types/content";
import { Button } from "@ratecreator/ui";
import { capitalizeFirstLetter } from "@ratecreator/db/utils";
import Link from "next/link";
import { SelectComponent } from "@ratecreator/ui/common";
import { fetchAllTagsWithPostCount } from "@ratecreator/actions/content";

export const PostsNavbar = () => {
  const [contentType, setContentType] = useRecoilState(contentTypeAtom);
  const [postStatus, setPostStatus] = useRecoilState(postStatusAtom);
  const [tags, setTags] = useRecoilState(listOfTagsState);
  const [postListTags, setPostListTags] = useRecoilState(postListTagsState);

  const contentTypes = [
    { value: ContentType.BLOG.toLowerCase(), label: "Blog" },
    { value: ContentType.GLOSSARY.toLowerCase(), label: "Glossary" },
    { value: ContentType.NEWSLETTER.toLowerCase(), label: "Newsletter" },
    { value: ContentType.LEGAL.toLowerCase(), label: "Legal" },
  ];

  const statusOptions = [
    { value: PostStatus.DRAFT.toLowerCase(), label: "Draft" },
    { value: PostStatus.PUBLISHED.toLowerCase(), label: "Published" },
    { value: PostStatus.SCHEDULED.toLowerCase(), label: "Scheduled" },
    { value: PostStatus.DELETED.toLowerCase(), label: "Deleted" },
  ];

  useEffect(() => {
    const fetchTags = async () => {
      const fetchedTags = await fetchAllTagsWithPostCount();
      setTags(fetchedTags);
    };

    fetchTags();
  }, []);

  const handleSelectContentType = (value: string) => {
    setContentType(value ? (value.toUpperCase() as ContentType) : null);
  };

  const handleSelectStatus = (value: string) => {
    setPostStatus(value ? (value.toUpperCase() as PostStatus) : null);
  };

  const handleSelectTagOption = (item: string) => {
    setPostListTags(item);
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
        <div className="flex flex-row gap-2 gap-x-4 justify-between mx-auto mr-4 items-center">
          <div className="">
            <SelectComponent
              items={contentTypes}
              placeholder="all-posts"
              onSelect={handleSelectContentType}
              selectedItem={contentType?.toLowerCase() || ""}
              showAll={true}
            />
          </div>
          <div className="">
            <SelectComponent
              items={statusOptions}
              placeholder="all-status"
              onSelect={handleSelectStatus}
              selectedItem={postStatus?.toLowerCase() || ""}
              showAll={true}
            />
          </div>
          <div className="mr-1 text-sm md:text-sm ">All authors</div>
          <div className="mr-1 text-sm md:text-sm ">
            <SelectComponent
              items={tags.map((tag) => ({
                value: tag.slug,
                label: capitalizeFirstLetter(tag.slug),
              }))}
              placeholder="all-tags"
              onSelect={handleSelectTagOption}
              selectedItem={postListTags}
              showAll={true}
            />
          </div>
          <div className="mr-1 text-sm md:text-sm">Newest first</div>
        </div>
      </div>

      {/* md screen */}
      <div className="hidden md:flex flex-col md:flex-row gap-2 md:gap-8 justify-end mr-4 items-center md:max-w-7xl mx-auto w-full ">
        <div className="">
          <SelectComponent
            items={contentTypes}
            placeholder="all-posts"
            onSelect={handleSelectContentType}
            selectedItem={contentType?.toLowerCase() || ""}
            showAll={true}
          />
        </div>
        <div className="">
          <SelectComponent
            items={statusOptions}
            placeholder="all-status"
            onSelect={handleSelectStatus}
            selectedItem={postStatus?.toLowerCase() || ""}
            showAll={true}
          />
        </div>
        <div className="mr-1 text-sm md:text-sm ">All authors</div>
        <div className="mr-1 text-sm md:text-sm ">
          <SelectComponent
            items={tags.map((tag) => ({
              value: tag.slug,
              label: capitalizeFirstLetter(tag.slug),
            }))}
            placeholder="all-tags"
            onSelect={handleSelectTagOption}
            selectedItem={postListTags}
            showAll={true}
          />
        </div>
        <div className="mr-1 text-sm md:text-sm">Newest first</div>

        <Link href="/new-post" className="mr-4">
          <Button variant="outline">New post</Button>
        </Link>
      </div>
    </>
  );
};
