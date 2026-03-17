import { Button, Text, Section } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./layout";
import { BASE_URL } from "../constants";

interface NewsletterVerifyProps {
  verifyUrl: string;
  name?: string;
}

export function NewsletterVerifyEmail({
  verifyUrl,
  name,
}: NewsletterVerifyProps) {
  return (
    <EmailLayout previewText="Verify your newsletter subscription">
      <Text style={headingStyle}>Verify your email</Text>
      <Text style={textStyle}>Hey{name ? ` ${name}` : ""},</Text>
      <Text style={textStyle}>
        Thanks for subscribing to the Rate Creator newsletter! Please verify
        your email address by clicking the button below.
      </Text>
      <Section style={{ textAlign: "center", margin: "32px 0" }}>
        <Button style={buttonStyle} href={verifyUrl}>
          Verify Email Address
        </Button>
      </Section>
      <Text style={smallTextStyle}>
        If you didn&apos;t subscribe to this newsletter, you can safely ignore
        this email.
      </Text>
      <Text style={smallTextStyle}>This link will expire in 24 hours.</Text>
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

const smallTextStyle: React.CSSProperties = {
  color: "#71717a",
  fontSize: "14px",
  lineHeight: "1.5",
  margin: "4px 0",
};

const buttonStyle: React.CSSProperties = {
  backgroundColor: "#22c55e",
  color: "#000000",
  fontSize: "16px",
  fontWeight: 600,
  padding: "12px 32px",
  borderRadius: "6px",
  textDecoration: "none",
  display: "inline-block",
};
