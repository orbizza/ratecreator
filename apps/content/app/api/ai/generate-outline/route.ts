import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { VertexAI } from "@google-cloud/vertexai";

interface OutlineRequest {
  title: string;
  description?: string;
  topics?: string[];
  additionalContext?: string;
  contentPlatform?: "RATECREATOR" | "CREATOROPS" | "DOCUMENTATION";
  contentType?: "BLOG" | "GLOSSARY" | "NEWSLETTER";
}

const projectId = process.env.GCP_PROJECT_ID;
const location = process.env.GCP_LOCATION || "us-central1";

let vertexAI: VertexAI | null = null;

function getVertexAI(): VertexAI | null {
  if (!vertexAI && projectId) {
    vertexAI = new VertexAI({
      project: projectId,
      location,
    });
  }
  return vertexAI;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let requestData: OutlineRequest = { title: "" };

  try {
    requestData = (await request.json()) as OutlineRequest;
    const {
      title,
      description,
      topics,
      additionalContext,
      contentPlatform = "RATECREATOR",
      contentType = "BLOG",
    } = requestData;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const ai = getVertexAI();

    if (!ai) {
      const fallbackOutline = generateFallbackOutline(
        title,
        description,
        topics,
        contentType,
      );
      return NextResponse.json({ outline: fallbackOutline });
    }

    const model = ai.getGenerativeModel({ model: "gemini-2.0-flash" });

    const topicsStr =
      topics && topics.length > 0
        ? `Topics/Keywords: ${topics.join(", ")}`
        : "";

    const platformContext = getPlatformContext(contentPlatform);
    const contentTypeGuide = getContentTypeGuide(contentType);

    const prompt = `You are an expert blog writer and content strategist. Generate a detailed, well-structured outline for the following idea:

Title: ${title}
${description ? `Description: ${description}` : ""}
${topicsStr}
${additionalContext ? `Additional Context: ${additionalContext}` : ""}

${platformContext}
${contentTypeGuide}

Create a comprehensive outline that includes:
1. An engaging introduction that hooks the reader
2. 3-5 main sections with clear headings
3. Key points to cover under each section
4. A compelling conclusion with a call-to-action

Format the outline in markdown with proper heading hierarchy (## for main sections, ### for subsections).

Important:
- Make the outline actionable and specific
- Include suggestions for examples or data points where relevant
- Consider SEO best practices in the structure
- Keep the tone professional but engaging

Generate the outline now:`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const firstCandidate = response.candidates?.[0];
    const content = firstCandidate?.content;
    const parts = content?.parts;
    const firstPart = parts?.[0];
    const outline = firstPart?.text ?? "";

    if (!outline) {
      throw new Error("No outline generated");
    }

    return NextResponse.json({ outline });
  } catch {
    const fallbackOutline = generateFallbackOutline(
      requestData.title || "Blog Post",
      requestData.description,
      requestData.topics,
      requestData.contentType,
    );

    return NextResponse.json({ outline: fallbackOutline });
  }
}

function getPlatformContext(platform: string): string {
  switch (platform) {
    case "RATECREATOR":
      return `Platform Context: RateCreator - a platform for discovering, reviewing, and rating content creators. Content should focus on the creator economy, platform reviews, and creator insights.`;
    case "CREATOROPS":
      return `Platform Context: CreatorOps - a portal for content creators to manage their presence. Content should focus on creator tools, growth strategies, and audience engagement.`;
    case "DOCUMENTATION":
      return `Platform Context: Technical documentation and guides for developers and users.`;
    default:
      return "";
  }
}

function getContentTypeGuide(contentType: string): string {
  switch (contentType) {
    case "BLOG":
      return `Content Type: Blog post - informative, engaging, and SEO-optimized long-form content.`;
    case "GLOSSARY":
      return `Content Type: Glossary entry - concise definitions with examples and related terms. Structure should include definition, examples, related terms, and practical usage.`;
    case "NEWSLETTER":
      return `Content Type: Newsletter - engaging, scannable content with clear sections, highlights, and calls-to-action. Keep it concise but valuable.`;
    default:
      return "";
  }
}

function generateFallbackOutline(
  title: string,
  description?: string,
  topics?: string[],
  contentType?: string,
): string {
  if (contentType === "GLOSSARY") {
    return `# ${title}

## Definition
- Clear, concise definition of the term
${description ? `- ${description}` : "- Explain what this term means in the context of the creator economy"}

## Key Points
${topics?.[0] ? `### ${topics[0]}` : "### Important Aspect 1"}
- Explain this aspect
- Provide context

## Examples
- Real-world example 1
- Real-world example 2

## Related Terms
- Related term 1
- Related term 2

## Practical Usage
- How this concept applies in practice
- Tips for applying this knowledge

---

*Note: This is a template outline. Configure Vertex AI for AI-generated outlines.*`;
  }

  if (contentType === "NEWSLETTER") {
    return `# ${title}

## Quick Summary
- Key highlight 1
- Key highlight 2
${description ? `- ${description}` : ""}

## This Week's Main Story
### ${topics?.[0] || "Featured Topic"}
- Main point
- Supporting details
- Why it matters

## Quick Hits
${topics?.[1] ? `### ${topics[1]}` : "### News Item 1"}
- Brief update

${topics?.[2] ? `### ${topics[2]}` : "### News Item 2"}
- Brief update

## Creator Tip of the Week
- Actionable advice
- How to implement

## Call to Action
- What readers should do next

---

*Note: This is a template outline. Configure Vertex AI for AI-generated outlines.*`;
  }

  return `# ${title}

## Introduction
- Hook the reader with an interesting opening
- Briefly introduce the topic
${description ? `- ${description}` : "- State the main premise of the article"}
- Preview what readers will learn

## Background/Context
- Provide necessary background information
- Define key terms if needed
- Set the stage for the main content

## Main Section 1
${topics?.[0] ? `### ${topics[0]}` : "### Key Point 1"}
- Discuss the first major point
- Include relevant examples
- Provide supporting evidence or data

## Main Section 2
${topics?.[1] ? `### ${topics[1]}` : "### Key Point 2"}
- Explore the second major aspect
- Connect to the previous section
- Add practical insights

## Main Section 3
${topics?.[2] ? `### ${topics[2]}` : "### Key Point 3"}
- Cover the third important element
- Include actionable tips
- Reference real-world applications

## Practical Tips/How-To
- List actionable steps readers can take
- Provide specific recommendations
- Include tools or resources if relevant

## Conclusion
- Summarize the key takeaways
- Reinforce the main message
- Include a call-to-action for readers

---

*Note: This is a template outline. Configure Vertex AI for AI-generated outlines.*`;
}
