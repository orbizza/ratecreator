"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeft, ArrowRight, MoveRight } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Badge,
  Button,
} from "@ratecreator/ui";

import { useNewsletterMarkdown } from "@ratecreator/ui/common";

import { useRecoilState, useRecoilValue } from "recoil";

import {
  selectDate,
  postDataState,
  selectedTimeIst,
  postIdState,
  savePostErrorState,
  postTypeState,
} from "@ratecreator/store/content";

import { publishPost } from "@ratecreator/actions/content";
import { useRouter } from "next/navigation";
import {
  dateTimeValidation,
  FetchedPostType,
  ContentType,
} from "@ratecreator/types/content";

interface PublishDialogProps {
  value: boolean;
  onOpenChange: (value: boolean) => void;
}

const PublishDialog = ({ value, onOpenChange }: PublishDialogProps) => {
  const router = useRouter();

  const [isFirstDialogOpen, setFirstDialogOpen] = useState(value);
  const [isSecondDialogOpen, setSecondDialogOpen] = useState(false);
  const [scheduleType, setScheduleType] = useState("now");
  const [openAccordionItem, setOpenAccordionItem] = useState<
    string | undefined
  >(undefined);
  const [error, setError] = useRecoilState(savePostErrorState);

  const [inputDate, setInputDate] = useRecoilState(selectDate);
  const [inputTimeIst, setInputTimeIst] = useRecoilState(selectedTimeIst);

  const postId = useRecoilValue(postIdState);
  const post = useRecoilValue(postDataState);
  const contentType = useRecoilValue(postTypeState);
  const publishType = contentType || post?.contentType || ContentType.BLOG;

  const { markdown: newsletterMarkdown, NewsletterMarkdown } =
    useNewsletterMarkdown(post?.content || "");

  const handleScheduleTypeChange = (type: string) => {
    setScheduleType(type);
    if (type === "later") {
      setOpenAccordionItem("schedule");
    }
  };

  const handleContinue = () => {
    setFirstDialogOpen(false);
    setSecondDialogOpen(true);
  };

  const handleBackToSettings = () => {
    setSecondDialogOpen(false);
    setFirstDialogOpen(true);
  };

  const handlePublish = async () => {
    if (!postId) {
      console.error("Post ID is required");
      return;
    }
    try {
      const markdown =
        publishType === ContentType.NEWSLETTER ? newsletterMarkdown : "";

      const timeValidation = await dateTimeValidation(inputDate, inputTimeIst);

      if (timeValidation.error) {
        setError(timeValidation.error);
      } else {
        setError(null);
      }

      const result = await publishPost(
        post as FetchedPostType,
        scheduleType,
        postId,
        markdown
      );

      if (result.success) {
        console.log("Post published successfully");
        setSecondDialogOpen(false);
        setFirstDialogOpen(false);
        router.push(`/${post?.contentPlatform.toLowerCase()}`);
      } else {
        console.error("Error publishing post:", result.error);
        setError(result.error || "Failed to publish post");
      }
    } catch (error) {
      console.error("Error publishing post:", error);
      setError("An unexpected error occurred");
    }
  };

  useEffect(() => {
    setFirstDialogOpen(value);
  }, [value]);

  useEffect(() => {
    onOpenChange(isFirstDialogOpen);
  }, [isFirstDialogOpen, onOpenChange]);

  const getScheduleText = (
    scheduleType: string,
    publishType: ContentType,
    inputDate: Date,
    inputTimeIst: string
  ) => {
    if (scheduleType === "now") {
      return publishType === ContentType.NEWSLETTER
        ? "Publish & send, right now"
        : "Publish, right now";
    }

    return `Schedule for ${formatDayAndDate(inputDate)} at ${inputTimeIst} IST`;
  };

  return (
    <>
      {/* Hidden component to generate markdown */}
      {publishType === ContentType.NEWSLETTER && post?.content && (
        <NewsletterMarkdown />
      )}

      {/* FIRST DIALOG */}
      <Dialog
        open={isFirstDialogOpen}
        onOpenChange={(open) => !open && setFirstDialogOpen(false)}
      >
        <DialogContent className='fixed  w-full h-full bg-gray-900 border-none flex flex-col !max-w-none !max-h-none overflow-hidden'>
          {/* Top Navigation Area */}
          <div className='flex items-center justify-between px-4 py-2 flex-shrink-0'>
            <div className='flex items-center space-x-2'>
              <Button
                variant='ghost'
                onClick={() => setFirstDialogOpen(false)}
                className='text-muted-foreground'
              >
                <ChevronLeft className='h-4 w-4 mr-1' />
                <span>Editor</span>
              </Button>
            </div>
            <div className='flex items-center space-x-4 mr-4'>
              <Button variant='ghost' className='text-gray-400'>
                Preview
              </Button>
              <Button
                variant='ghost'
                className='text-green-500 hover:text-green-500 bg-neutral-800 hover:bg-neutral-950'
                onClick={() => setFirstDialogOpen(false)}
              >
                Publish
              </Button>
            </div>
          </div>

          {/* Main Content Area */}
          {/*
            1) Use flex-1 to stretch
            2) items-center + justify-center to center content
            (If you'd rather keep it top-aligned but centered horizontally, remove justify-center.)
          */}
          <div className='flex-1 overflow-y-auto flex flex-col items-center justify-center p-8 '>
            {/* You can also wrap this in a narrower container if desired */}
            <div className='w-full max-w-xl'>
              <DialogHeader className='mb-10 text-left sm:text-center'>
                <DialogTitle className='-mt-12'>
                  <div className='text-3xl sm:text-4xl md:text-5xl font-bold text-green-500 mb-2'>
                    Ready, set, publish.
                  </div>
                  <div className='text-3xl sm:text-4xl md:text-5xl font-bold text-white'>
                    Share it with the world.
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className='space-y-12'>
                <Accordion
                  type='single'
                  collapsible
                  className='w-full space-y-3'
                  value={openAccordionItem}
                  onValueChange={setOpenAccordionItem}
                >
                  <AccordionItem
                    value='publish-type'
                    className='border-b-[1px] border-gray-700'
                  >
                    <AccordionTrigger className='text-gray-200 text-lg'>
                      {publishType === ContentType.NEWSLETTER
                        ? `Publish as ${publishType.toLowerCase()} and send mails`
                        : `Publish as ${publishType.toLowerCase()}`}
                    </AccordionTrigger>
                  </AccordionItem>

                  <AccordionItem value='schedule' className='border-none'>
                    <AccordionTrigger className='text-gray-200 text-lg'>
                      {scheduleType === "now"
                        ? "Right now"
                        : `Schedule for ${formatDayAndDate(
                            inputDate
                          )} at ${inputTimeIst} IST`}
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className='space-y-4'>
                        <div className='flex gap-2'>
                          <Badge
                            className={`cursor-pointer text-base py-2 px-4 rounded-md ${
                              scheduleType === "now"
                                ? "bg-green-500"
                                : "bg-gray-700"
                            }`}
                            onClick={() => handleScheduleTypeChange("now")}
                          >
                            Set it live now
                          </Badge>
                          <Badge
                            className={`cursor-pointer text-base py-2 px-4 rounded-md ${
                              scheduleType === "later"
                                ? "bg-green-500"
                                : "bg-gray-700"
                            }`}
                            onClick={() => handleScheduleTypeChange("later")}
                          >
                            Schedule for later
                          </Badge>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
                <Button
                  className='bg-white text-black hover:bg-gray-200 py-6 text-lg mt-8'
                  onClick={handleContinue}
                >
                  <span className='flex flex-row items-center ml-2'>
                    Continue, final review
                    <MoveRight className='size-5 ml-4 mr-2' />
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* SECOND DIALOG */}
      <Dialog
        open={isSecondDialogOpen}
        onOpenChange={(open) => !open && setSecondDialogOpen(false)}
      >
        <DialogContent className='fixed w-full h-full border-none bg-gray-900 flex flex-col !max-w-none !max-h-none overflow-hidden'>
          {/* Top Navigation Area */}
          <div className='flex items-center justify-between px-4 py-2 flex-shrink-0 '>
            <div className='flex items-center space-x-2'>
              <Button
                variant='ghost'
                onClick={() => setSecondDialogOpen(false)}
                className='text-muted-foreground'
              >
                <ChevronLeft className='h-4 w-4 mr-1' />
                <span>Editor</span>
              </Button>
            </div>
            <div className='flex flex-row items-center space-x-4 mr-4'>
              <Button variant='ghost' className='text-gray-400'>
                Preview
              </Button>
              <Button
                variant='ghost'
                className='text-green-500 hover:text-green-500 bg-neutral-800 hover:bg-neutral-950'
                onClick={() => setSecondDialogOpen(false)}
              >
                Publish
              </Button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className='flex-1 overflow-y-auto flex flex-col items-center justify-center p-8'>
            <div className='w-full max-w-xl'>
              <DialogHeader className='mb-8 text-left sm:text-center'>
                <DialogTitle className='-mt-12'>
                  <div className='text-3xl sm:text-4xl md:text-6xl font-bold text-green-500 mb-3'>
                    Ready, set, publish.
                  </div>
                  <div className='text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2'>
                    Share it with the world.
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className='space-y-6'>
                <p className='text-gray-300 text-base sm:text-lg'>
                  Your post will be published on your{" "}
                  {publishType === ContentType.NEWSLETTER
                    ? "newsletter section, and delivered to all subscribers."
                    : `${publishType.toLowerCase()} section.`}
                </p>

                <div className='flex flex-col sm:flex-row gap-4'>
                  <Button
                    className='flex-1 bg-green-500 hover:bg-green-600  py-6 '
                    onClick={handlePublish}
                  >
                    {getScheduleText(
                      scheduleType,
                      publishType as ContentType,
                      inputDate,
                      inputTimeIst
                    )}
                  </Button>
                  <Button
                    className='flex-1 py-6 bg-neutral-700 '
                    onClick={handleBackToSettings}
                    variant='ghost'
                  >
                    Back to settings
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

function formatDayAndDate(date: Date) {
  const options = {
    weekday: "short",
    month: "short",
    day: "2-digit",
    year: "numeric",
  } as const;
  return date.toLocaleDateString("en-US", options).replace(",", "");
}

export default PublishDialog;
