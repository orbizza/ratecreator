import { Text, Section, Link } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./layout";
import { BASE_URL } from "../constants";

interface NewsletterWelcomeProps {
  name?: string;
  unsubscribeUrl: string;
}

export function NewsletterWelcomeEmail({
  name,
  unsubscribeUrl,
}: NewsletterWelcomeProps) {
  return (
    <EmailLayout
      previewText="Welcome to the Rate Creator newsletter!"
      unsubscribeUrl={unsubscribeUrl}
    >
      <Text style={headingStyle}>Welcome aboard!</Text>
      <Text style={textStyle}>Hey{name ? ` ${name}` : ""},</Text>
      <Text style={textStyle}>
        You&apos;re now subscribed to the Rate Creator newsletter. Here&apos;s
        what you can expect:
      </Text>
      <Section style={{ margin: "16px 0" }}>
        <Text style={listItemStyle}>Creator economy insights and trends</Text>
        <Text style={listItemStyle}>
          Tips for discovering great content creators
        </Text>
        <Text style={listItemStyle}>Platform updates and new features</Text>
        <Text style={listItemStyle}>Community highlights and top reviews</Text>
      </Section>
      <Text style={textStyle}>
        In the meantime, explore creators on{" "}
        <Link href={BASE_URL} style={linkStyle}>
          ratecreator.com
        </Link>
        .
      </Text>
      <Text style={signoffStyle}>— The Rate Creator Team</Text>
    </EmailLayout>
  );
}

const headingStyle: React.CSSProperties = {
  color: "#ffffff",
  fontSize: "24px",
  fontWeight: 700,
  margin: "0 0 16px",
};

const textStyle: React.CSSProperties = {
  color: "#d4d4d8",
  fontSize: "16px",
  lineHeight: "1.6",
  margin: "8px 0",
};

const listItemStyle: React.CSSProperties = {
  color: "#d4d4d8",
  fontSize: "15px",
  lineHeight: "1.4",
  margin: "4px 0",
  paddingLeft: "16px",
};

const linkStyle: React.CSSProperties = {
  color: "#3b82f6",
  textDecoration: "underline",
};

const signoffStyle: React.CSSProperties = {
  color: "#a1a1aa",
  fontSize: "16px",
  marginTop: "24px",
  fontStyle: "italic",
};
