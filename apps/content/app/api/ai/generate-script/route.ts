import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { VertexAI } from "@google-cloud/vertexai";

interface ScriptRequest {
  title: string;
  outline?: string;
  description?: string;
  topics?: string[];
  tone?: "professional" | "casual" | "educational" | "storytelling";
  targetLength?: "short" | "medium" | "long";
  includeCodeExamples?: boolean;
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
  let requestData: ScriptRequest = { title: "" };

  try {
    requestData = (await request.json()) as ScriptRequest;
    const {
      title,
      outline,
      description,
      topics,
      tone = "professional",
      targetLength = "medium",
      includeCodeExamples = false,
      contentPlatform = "RATECREATOR",
      contentType = "BLOG",
    } = requestData;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const ai = getVertexAI();

    if (!ai) {
      const fallbackScript = generateFallbackScript(
        title,
        description,
        topics,
        contentType,
      );
      return NextResponse.json({ script: fallbackScript });
    }

    const model = ai.getGenerativeModel({ model: "gemini-2.0-flash" });

    const lengthGuide: Record<string, string> = {
      short: "around 800-1000 words",
      medium: "around 1500-2000 words",
      long: "around 2500-3500 words",
    };

    const toneGuide: Record<string, string> = {
      professional:
        "Use a professional, authoritative tone with industry terminology where appropriate",
      casual:
        "Use a conversational, friendly tone as if talking to a colleague",
      educational:
        "Use a teaching-focused tone, explaining concepts clearly with examples",
      storytelling:
        "Use a narrative approach, weaving in stories and real-world scenarios",
    };

    const topicsStr =
      topics && topics.length > 0
        ? `\nKeywords/Topics to incorporate: ${topics.join(", ")}`
        : "";
    const outlineStr = outline ? `\n\nFollow this outline:\n${outline}` : "";
    const codeStr = includeCodeExamples
      ? "\n\nInclude relevant code examples where appropriate, using markdown code blocks with syntax highlighting."
      : "";

    const platformContext = getPlatformContext(contentPlatform);
    const contentTypeGuide = getContentTypeGuide(contentType, targetLength);

    const prompt = `You are an expert blog writer and content creator. Write a complete, polished ${contentType.toLowerCase()} based on the following:

Title: ${title}
${description ? `Brief: ${description}` : ""}${topicsStr}${outlineStr}

${platformContext}
${contentTypeGuide}

Requirements:
- Target length: ${lengthGuide[targetLength]}
- Tone: ${toneGuide[tone]}${codeStr}

Format guidelines:
- Use proper markdown formatting
- Start with a compelling hook (do NOT include the title as an H1, it will be added separately)
- Use ## for main section headings
- Use ### for subsections
- Include bullet points and numbered lists where appropriate
- Add a conclusion with a clear takeaway or call-to-action
- Make it SEO-friendly with natural keyword usage

Quality standards:
- Write original, engaging content
- Include specific examples and actionable advice
- Avoid fluff and filler content
- Ensure logical flow between sections
- End with a thought-provoking conclusion

Write the complete content now (respond with ONLY the markdown content, no meta commentary):`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const firstCandidate = response.candidates?.[0];
    const content = firstCandidate?.content;
    const parts = content?.parts;
    const firstPart = parts?.[0];
    const script = firstPart?.text ?? "";

    if (!script) {
      throw new Error("No script generated");
    }

    return NextResponse.json({ script });
  } catch {
    const fallbackScript = generateFallbackScript(
      requestData.title || "Blog Post",
      requestData.description,
      requestData.topics,
      requestData.contentType,
    );
    return NextResponse.json({ script: fallbackScript });
  }
}

function getPlatformContext(platform: string): string {
  switch (platform) {
    case "RATECREATOR":
      return `Platform Context: RateCreator - a platform for discovering, reviewing, and rating content creators across social media. Content should focus on the creator economy, platform comparisons, reviews, and insights.`;
    case "CREATOROPS":
      return `Platform Context: CreatorOps - a portal for content creators. Content should focus on creator tools, monetization, growth strategies, and audience engagement.`;
    case "DOCUMENTATION":
      return `Platform Context: Technical documentation. Content should be clear, precise, and developer-friendly with code examples and step-by-step instructions.`;
    default:
      return "";
  }
}

function getContentTypeGuide(
  contentType: string,
  targetLength: string,
): string {
  switch (contentType) {
    case "BLOG":
      return `Content Type: Blog post - informative, engaging, and SEO-optimized content.`;
    case "GLOSSARY":
      return `Content Type: Glossary entry - concise definitions with examples and related terms. Keep it shorter than a typical blog post. Structure: definition, explanation, examples, related terms, practical tips.`;
    case "NEWSLETTER":
      return `Content Type: Newsletter - engaging, scannable content. Use short paragraphs, bullet points, and clear sections. Include highlights and calls-to-action. Keep overall length ${targetLength === "short" ? "around 500-700 words" : "around 800-1200 words"}.`;
    default:
      return "";
  }
}

function generateFallbackScript(
  title: string,
  description?: string,
  topics?: string[],
  contentType?: string,
): string {
  if (contentType === "GLOSSARY") {
    return `**${title}** refers to a concept or term commonly used in the creator economy and content creation space.

## What is ${title}?

${description || `${title} is an important concept that every content creator should understand. It relates to how creators build, engage, and grow their audience across various platforms.`}

## Key Characteristics

${topics?.length ? topics.map((t) => `- **${t}**: An important aspect of ${title.toLowerCase()}`).join("\n") : "- Core feature or attribute\n- Secondary characteristic\n- Practical application"}

## Examples in Practice

Here are some real-world examples of how ${title.toLowerCase()} works:

1. **Example 1**: A creator using this concept to grow their channel
2. **Example 2**: How brands leverage this in their creator partnerships

## Related Terms

- Related concept 1
- Related concept 2
- Related concept 3

## Why It Matters

Understanding ${title.toLowerCase()} helps creators make better decisions about their content strategy and audience engagement.

---

*Note: This is a template. Configure Vertex AI for AI-generated content.*`;
  }

  if (contentType === "NEWSLETTER") {
    return `Welcome to this week's newsletter! Here's what's happening in the creator economy.

## This Week's Highlights

${description || "The creator landscape continues to evolve with new tools, platforms, and opportunities emerging every day."}

## Main Story: ${title}

${topics?.[0] ? `This week we're focusing on **${topics[0]}** and what it means for creators.` : "This week brings exciting developments that every creator should know about."}

The key takeaways:
- Important insight 1
- Important insight 2
- Important insight 3

## Quick Updates

${
  topics
    ?.slice(1, 3)
    .map(
      (t) =>
        `### ${t}\nBrief update about this topic and why it matters to creators.\n`,
    )
    .join("\n") ||
  "### Industry News\nBrief update on the latest happenings.\n\n### Tool Spotlight\nA useful tool or resource for creators."
}

## Creator Tip

Here's an actionable tip you can implement this week: Focus on consistency over perfection. Small, regular improvements compound over time.

## What's Next?

Stay tuned for more updates next week. In the meantime, keep creating!

---

*Note: This is a template. Configure Vertex AI for AI-generated content.*`;
  }

  const topicsSection = topics?.length
    ? topics.map((t) => `- **${t}**: Explore this aspect in detail`).join("\n")
    : "- Add your key points here";

  return `In today's fast-paced world, understanding ${title.toLowerCase()} has become increasingly important. ${description || "This comprehensive guide will walk you through everything you need to know."}

## Why This Matters

Before diving into the details, it's crucial to understand why this topic deserves your attention. The landscape is constantly evolving, and staying informed is key to success.

## Key Concepts

Let's explore the fundamental concepts:

${topicsSection}

## Getting Started

Here's how to begin your journey:

1. **Start with the basics** - Build a solid foundation before moving to advanced topics
2. **Practice consistently** - Regular application reinforces learning
3. **Seek feedback** - Learn from others' experiences and insights

## Best Practices

Based on industry experience, here are proven strategies:

- Focus on quality over quantity
- Stay updated with the latest developments
- Build a supportive community around you

## Common Pitfalls to Avoid

Many people make these mistakes:

- Rushing through fundamentals
- Ignoring feedback and iteration
- Working in isolation

## Conclusion

Mastering ${title.toLowerCase()} is a journey, not a destination. Start with the basics, remain consistent, and don't be afraid to experiment. The key is to take action and learn from both successes and failures.

What aspect of this topic interests you most? Share your thoughts in the comments below.

---

*Note: This is a template. Configure Vertex AI for AI-generated content.*`;
}
