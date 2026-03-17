import { Text, Section, Hr, Img, Link, Button } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./layout";

interface NewsletterIssueProps {
  title: string;
  contentHtml?: string;
  excerpt?: string;
  featureImage?: string;
  authorName?: string;
  authorImageUrl?: string;
  publishDate?: string;
  postUrl?: string;
  hideUnsubscribe?: boolean;
  unsubscribeUrl?: string;
  previewText?: string;
}

export function NewsletterIssueEmail({
  title,
  contentHtml,
  excerpt,
  featureImage,
  authorName,
  authorImageUrl,
  publishDate,
  postUrl,
  hideUnsubscribe = false,
  unsubscribeUrl,
  previewText,
}: NewsletterIssueProps) {
  const hasFullContent = !!contentHtml;

  return (
    <EmailLayout
      previewText={previewText || excerpt || title}
      hideUnsubscribe={hideUnsubscribe}
      unsubscribeUrl={unsubscribeUrl}
    >
      {/* Feature Image */}
      {featureImage && (
        <Section style={featureImageContainerStyle}>
          {postUrl ? (
            <Link href={postUrl} style={{ textDecoration: "none" }}>
              <Img
                src={featureImage}
                alt={title}
                style={featureImageStyle}
                width="100%"
              />
            </Link>
          ) : (
            <Img
              src={featureImage}
              alt={title}
              style={featureImageStyle}
              width="100%"
            />
          )}
        </Section>
      )}

      {/* Author & Date */}
      {(authorName || publishDate) && (
        <Section style={metaStyle}>
          {authorImageUrl && (
            <Img
              src={authorImageUrl}
              alt={authorName || ""}
              width={28}
              height={28}
              style={authorAvatarStyle}
            />
          )}
          {authorName && <Text style={authorNameStyle}>{authorName}</Text>}
          {authorName && publishDate && (
            <Text style={metaSeparatorStyle}>&middot;</Text>
          )}
          {publishDate && <Text style={dateStyle}>{publishDate}</Text>}
        </Section>
      )}

      {/* Title */}
      <Text style={titleStyle}>{title}</Text>

      <Hr style={dividerStyle} />

      {/* Full Content or Excerpt */}
      {hasFullContent ? (
        <Section
          dangerouslySetInnerHTML={{ __html: contentHtml! }}
          style={contentStyle}
        />
      ) : excerpt ? (
        <Section style={excerptStyle}>
          <Text style={excerptTextStyle}>{excerpt}</Text>
        </Section>
      ) : null}

      {/* "View on Website" Button */}
      {postUrl && (
        <Section style={ctaContainerStyle}>
          <Button href={postUrl} style={ctaButtonStyle}>
            {hasFullContent ? "View on Website" : "Read Full Article"}
          </Button>
        </Section>
      )}
    </EmailLayout>
  );
}

const featureImageContainerStyle: React.CSSProperties = {
  margin: "0 0 24px",
};

const featureImageStyle: React.CSSProperties = {
  maxWidth: "100%",
  height: "auto",
  borderRadius: "8px",
  display: "block",
};

const metaStyle: React.CSSProperties = {
  margin: "0 0 12px",
};

const authorAvatarStyle: React.CSSProperties = {
  borderRadius: "50%",
  display: "inline-block",
  verticalAlign: "middle",
  marginRight: "8px",
};

const authorNameStyle: React.CSSProperties = {
  display: "inline",
  color: "#a1a1aa",
  fontSize: "14px",
  verticalAlign: "middle",
  margin: "0",
};

const metaSeparatorStyle: React.CSSProperties = {
  display: "inline",
  color: "#52525b",
  fontSize: "14px",
  margin: "0 6px",
  verticalAlign: "middle",
};

const dateStyle: React.CSSProperties = {
  display: "inline",
  color: "#71717a",
  fontSize: "14px",
  verticalAlign: "middle",
  margin: "0",
};

const titleStyle: React.CSSProperties = {
  color: "#ffffff",
  fontSize: "28px",
  fontWeight: 700,
  margin: "0 0 16px",
  lineHeight: "1.3",
};

const dividerStyle: React.CSSProperties = {
  borderTop: "1px solid #3f3f46",
  margin: "16px 0 24px",
};

const contentStyle: React.CSSProperties = {
  color: "#d4d4d8",
  fontSize: "16px",
  lineHeight: "1.6",
};

const excerptStyle: React.CSSProperties = {
  margin: "0 0 24px",
};

const excerptTextStyle: React.CSSProperties = {
  color: "#a1a1aa",
  fontSize: "16px",
  lineHeight: "1.6",
  margin: "0",
  fontStyle: "italic",
};

const ctaContainerStyle: React.CSSProperties = {
  textAlign: "center",
  margin: "32px 0 8px",
};

const ctaButtonStyle: React.CSSProperties = {
  backgroundColor: "#22c55e",
  color: "#ffffff",
  fontWeight: 600,
  fontSize: "16px",
  padding: "12px 32px",
  borderRadius: "6px",
  textDecoration: "none",
  display: "inline-block",
};
