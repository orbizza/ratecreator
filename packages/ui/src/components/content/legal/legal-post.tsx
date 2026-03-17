"use client";

import React, { useEffect, useState } from "react";
import { format } from "date-fns";

import { FetchedPostType } from "@ratecreator/types/content";
import { fetchPostByPostUrl } from "@ratecreator/actions/content";

import { BlockNoteRenderer } from "@ratecreator/ui/common";
import { LegalPostSkeleton } from "../content-skeletons/skeleton-legal-post";
import { useParams } from "next/navigation";

interface LegalPostProps {
  postUrl?: string;
}

export const LegalPost = ({ postUrl: postUrlProp }: LegalPostProps = {}) => {
  const params = useParams();
  const postUrl = postUrlProp || (params.slug as string);
  const [post, setPost] = useState<FetchedPostType>();

  const [isLoading, setIsLoading] = useState(true);

  const getPost = async () => {
    try {
      // Try to get from cache first
      setIsLoading(true);

      // If no cache, fetch fresh data
      const postData = await fetchPostByPostUrl(postUrl);

      setPost(postData as FetchedPostType);
    } catch (error) {
      console.error("Error fetching blog post:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getPost();
  }, []);

  // For pages with only static content (e.g. subprocessors), don't block on CMS post
  const hasStaticContent = postUrl === "subprocessors";

  if (isLoading && !hasStaticContent) {
    return (
      <div className="flex flex-row mt-10 items-center justify-center min-h-screen">
        <LegalPostSkeleton />
      </div>
    );
  }

  if (!post && !hasStaticContent) {
    return (
      <div className="flex flex-row mt-10 items-center justify-center min-h-screen">
        <LegalPostSkeleton />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto mt-20">
      {post && (
        <>
          <div className="flex gap-2 justify-center mb-10">
            <span className="text-sm text-neutral-600">
              Last updated:{" "}
              {post?.updatedAt
                ? format(new Date(post.updatedAt), "MMMM dd, yyyy")
                : ""}
            </span>
          </div>
          <div className="w-full px-2 sm:px-8 max-w-4xl mx-auto">
            <div className="flex flex-col gap-2">
              <div className="text-2xl sm:text-3xl md:text-5xl font-semibold mb-4">
                {post?.title}
              </div>
            </div>
            <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-y-2 sm:gap-y-0 ">
              <p className="pl-0 sm:pl-1 text-sm text-neutral-600 dark:text-neutral-400">
                {post?.publishDate
                  ? format(new Date(post?.publishDate), "MMMM dd, yyyy")
                  : ""}
              </p>
            </div>

            <div className="mt-10 ">
              <BlockNoteRenderer content={post.content} />
            </div>
          </div>
        </>
      )}
      <div className="w-full px-2 sm:px-8 max-w-4xl mx-auto">
        {postUrl === "terms" && (
          <div className="mt-12 p-6 border rounded-lg bg-muted/50">
            <h3 className="text-lg font-semibold mb-3">
              YouTube Terms of Service
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              By using Rate Creator, you are agreeing to be bound by the{" "}
              <a
                href="https://www.youtube.com/t/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                YouTube Terms of Service
              </a>
              .
            </p>
          </div>
        )}

        {postUrl === "privacy" && (
          <div className="mt-12 p-6 border rounded-lg bg-muted/50">
            <h3 className="text-lg font-semibold mb-3">
              YouTube API Services &amp; Google Privacy Policy
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Rate Creator uses YouTube API Services to display channel
              information, statistics, and other publicly available data from
              YouTube.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed mt-2">
              By using Rate Creator, you acknowledge that your use is also
              subject to the{" "}
              <a
                href="http://www.google.com/policies/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                Google Privacy Policy
              </a>
              .
            </p>
          </div>
        )}

        {postUrl === "subprocessors" && (
          <div className="mt-12 border-t pt-8">
            <h3 className="text-xl font-semibold mb-4">
              Third-Party Subprocessors
            </h3>
            <p className="text-muted-foreground mb-6">
              Rate Creator engages the following subprocessors to deliver its
              services. This list covers all applications, services, and data
              processing activities across the entire Rate Creator platform.
              Last updated: March 2026.
            </p>

            <h4 className="text-lg font-medium mt-8 mb-3">
              Infrastructure &amp; Hosting
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4 font-medium">
                      Subprocessor
                    </th>
                    <th className="text-left py-2 pr-4 font-medium">Purpose</th>
                    <th className="text-left py-2 pr-4 font-medium">
                      Data Processed
                    </th>
                    <th className="text-left py-2 pr-4 font-medium">
                      Location
                    </th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b">
                    <td className="py-2 pr-4">Google Cloud Platform</td>
                    <td className="py-2 pr-4">
                      Compute, AI, messaging, scheduling
                    </td>
                    <td className="py-2 pr-4">
                      Creator profiles, translations, categorizations
                    </td>
                    <td className="py-2 pr-4">US (us-central1)</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 pr-4">Elastic Cloud</td>
                    <td className="py-2 pr-4">Search indexing &amp; queries</td>
                    <td className="py-2 pr-4">
                      Creator profiles, ratings, categories
                    </td>
                    <td className="py-2 pr-4">US (us-central1)</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 pr-4">Vercel</td>
                    <td className="py-2 pr-4">
                      Web app hosting, serverless functions
                    </td>
                    <td className="py-2 pr-4">
                      User sessions, page renders, API responses
                    </td>
                    <td className="py-2 pr-4">US (Global Edge)</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 pr-4">DigitalOcean</td>
                    <td className="py-2 pr-4">
                      Managed MongoDB, managed Redis
                    </td>
                    <td className="py-2 pr-4">
                      All persistent data, cached data
                    </td>
                    <td className="py-2 pr-4">US (NYC3)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h4 className="text-lg font-medium mt-8 mb-3">
              Authentication &amp; Identity
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4 font-medium">
                      Subprocessor
                    </th>
                    <th className="text-left py-2 pr-4 font-medium">Purpose</th>
                    <th className="text-left py-2 pr-4 font-medium">
                      Data Processed
                    </th>
                    <th className="text-left py-2 pr-4 font-medium">
                      Location
                    </th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b">
                    <td className="py-2 pr-4">Clerk</td>
                    <td className="py-2 pr-4">
                      User authentication, OAuth, sessions
                    </td>
                    <td className="py-2 pr-4">
                      Email, name, profile image, OAuth tokens
                    </td>
                    <td className="py-2 pr-4">US</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h4 className="text-lg font-medium mt-8 mb-3">Communication</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4 font-medium">
                      Subprocessor
                    </th>
                    <th className="text-left py-2 pr-4 font-medium">Purpose</th>
                    <th className="text-left py-2 pr-4 font-medium">
                      Data Processed
                    </th>
                    <th className="text-left py-2 pr-4 font-medium">
                      Location
                    </th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b">
                    <td className="py-2 pr-4">Resend</td>
                    <td className="py-2 pr-4">
                      Transactional &amp; newsletter email
                    </td>
                    <td className="py-2 pr-4">
                      Subscriber emails, newsletter content
                    </td>
                    <td className="py-2 pr-4">US</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h4 className="text-lg font-medium mt-8 mb-3">
              Analytics &amp; Monitoring
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4 font-medium">
                      Subprocessor
                    </th>
                    <th className="text-left py-2 pr-4 font-medium">Purpose</th>
                    <th className="text-left py-2 pr-4 font-medium">
                      Data Processed
                    </th>
                    <th className="text-left py-2 pr-4 font-medium">
                      Location
                    </th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b">
                    <td className="py-2 pr-4">PostHog</td>
                    <td className="py-2 pr-4">
                      Product analytics, feature flags
                    </td>
                    <td className="py-2 pr-4">
                      Page views, click events, user properties
                    </td>
                    <td className="py-2 pr-4">EU (Frankfurt)</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 pr-4">Sentry</td>
                    <td className="py-2 pr-4">
                      Error tracking, performance monitoring
                    </td>
                    <td className="py-2 pr-4">
                      Error stack traces, request metadata
                    </td>
                    <td className="py-2 pr-4">US</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h4 className="text-lg font-medium mt-8 mb-3">
              Platform Data APIs
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4 font-medium">
                      Subprocessor
                    </th>
                    <th className="text-left py-2 pr-4 font-medium">Purpose</th>
                    <th className="text-left py-2 pr-4 font-medium">
                      Data Processed
                    </th>
                    <th className="text-left py-2 pr-4 font-medium">
                      Location
                    </th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b">
                    <td className="py-2 pr-4">Google / YouTube Data API</td>
                    <td className="py-2 pr-4">
                      Fetch &amp; refresh creator channel data
                    </td>
                    <td className="py-2 pr-4">
                      Channel name, subscribers, thumbnails
                    </td>
                    <td className="py-2 pr-4">US</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 pr-4">Meta / Instagram Graph API</td>
                    <td className="py-2 pr-4">
                      Fetch &amp; refresh creator profile data
                    </td>
                    <td className="py-2 pr-4">
                      Username, bio, follower count, profile image
                    </td>
                    <td className="py-2 pr-4">US</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 pr-4">Reddit API</td>
                    <td className="py-2 pr-4">
                      Fetch &amp; refresh subreddit/user data
                    </td>
                    <td className="py-2 pr-4">
                      Subreddit name, subscriber count
                    </td>
                    <td className="py-2 pr-4">US</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 pr-4">TikTok API</td>
                    <td className="py-2 pr-4">
                      Fetch &amp; refresh creator profile data
                    </td>
                    <td className="py-2 pr-4">
                      Username, follower count, video count
                    </td>
                    <td className="py-2 pr-4">US</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 pr-4">Twitter/X API</td>
                    <td className="py-2 pr-4">Fetch creator profile data</td>
                    <td className="py-2 pr-4">Handle, bio, follower count</td>
                    <td className="py-2 pr-4">US</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h4 className="text-lg font-medium mt-8 mb-3">
              AI &amp; Machine Learning
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4 font-medium">
                      Subprocessor
                    </th>
                    <th className="text-left py-2 pr-4 font-medium">Purpose</th>
                    <th className="text-left py-2 pr-4 font-medium">
                      Data Processed
                    </th>
                    <th className="text-left py-2 pr-4 font-medium">
                      Location
                    </th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b">
                    <td className="py-2 pr-4">Google Vertex AI (Gemini)</td>
                    <td className="py-2 pr-4">
                      Content translation, categorization
                    </td>
                    <td className="py-2 pr-4">
                      Creator names, descriptions, keywords
                    </td>
                    <td className="py-2 pr-4">US (us-central1)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h4 className="text-lg font-medium mt-8 mb-3">Storage</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4 font-medium">
                      Subprocessor
                    </th>
                    <th className="text-left py-2 pr-4 font-medium">Purpose</th>
                    <th className="text-left py-2 pr-4 font-medium">
                      Data Processed
                    </th>
                    <th className="text-left py-2 pr-4 font-medium">
                      Location
                    </th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b">
                    <td className="py-2 pr-4">Google Cloud Storage</td>
                    <td className="py-2 pr-4">
                      Object storage for images &amp; uploads
                    </td>
                    <td className="py-2 pr-4">
                      User uploads, creator images, blog media
                    </td>
                    <td className="py-2 pr-4">US (us-central1)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
