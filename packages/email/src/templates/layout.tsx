import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";
import { EMAIL_LOGO_URL, BASE_URL } from "../constants";

interface EmailLayoutProps {
  previewText?: string;
  children: React.ReactNode;
  hideUnsubscribe?: boolean;
  unsubscribeUrl?: string;
}

export function EmailLayout({
  previewText,
  children,
  hideUnsubscribe = false,
  unsubscribeUrl,
}: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      {previewText && <Preview>{previewText}</Preview>}
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          {/* Header */}
          <Section style={headerStyle}>
            <Link href={BASE_URL} style={{ textDecoration: "none" }}>
              <Img
                src={EMAIL_LOGO_URL}
                width={32}
                height={32}
                alt="Rate Creator"
                style={{ display: "inline-block", verticalAlign: "middle" }}
              />
              <Text style={logoTextStyle}>
                RATE<span style={{ color: "#ff3131" }}> CREATOR</span>
              </Text>
            </Link>
          </Section>

          {/* Content */}
          <Section style={contentStyle}>{children}</Section>

          {/* Footer */}
          <Section style={footerStyle}>
            <Text style={footerTextStyle}>
              &copy; {new Date().getFullYear()}{" "}
              <Link href="https://orbizza.com" style={footerLinkStyle}>
                Orbizza, Inc.
              </Link>{" "}
              All rights reserved.
            </Text>
            <Text style={footerTextStyle}>
              <Link href={`${BASE_URL}/privacy`} style={footerLinkStyle}>
                Privacy Policy
              </Link>
              {" | "}
              <Link href={`${BASE_URL}/terms`} style={footerLinkStyle}>
                Terms
              </Link>
            </Text>
            {!hideUnsubscribe && unsubscribeUrl && (
              <Text style={footerTextStyle}>
                <Link href={unsubscribeUrl} style={footerLinkStyle}>
                  Unsubscribe
                </Link>
              </Text>
            )}
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const bodyStyle: React.CSSProperties = {
  backgroundColor: "#09090b",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  margin: 0,
  padding: 0,
};

const containerStyle: React.CSSProperties = {
  maxWidth: "600px",
  margin: "0 auto",
  backgroundColor: "#18181b",
  borderRadius: "8px",
  overflow: "hidden",
};

const headerStyle: React.CSSProperties = {
  padding: "24px 32px",
  borderBottom: "1px solid #27272a",
  textAlign: "center",
};

const logoTextStyle: React.CSSProperties = {
  display: "inline-block",
  verticalAlign: "middle",
  fontSize: "18px",
  fontWeight: 600,
  color: "#ffffff",
  marginLeft: "8px",
};

const contentStyle: React.CSSProperties = {
  padding: "32px",
};

const footerStyle: React.CSSProperties = {
  padding: "24px 32px",
  borderTop: "1px solid #27272a",
  textAlign: "center",
};

const footerTextStyle: React.CSSProperties = {
  color: "#71717a",
  fontSize: "12px",
  margin: "4px 0",
};

const footerLinkStyle: React.CSSProperties = {
  color: "#a1a1aa",
  textDecoration: "underline",
};
