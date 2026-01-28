import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { VertexAI } from "@google-cloud/vertexai";

interface IdeasRequest {
  topics: string[];
  count?: number;
  contentPlatform?: "RATECREATOR" | "CREATOROPS" | "DOCUMENTATION";
}

interface GeneratedIdea {
  title: string;
  description: string;
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
  let requestData: IdeasRequest = { topics: [] };

  try {
    requestData = (await request.json()) as IdeasRequest;
    const { topics, count = 5, contentPlatform = "RATECREATOR" } = requestData;

    if (topics.length === 0) {
      return NextResponse.json(
        { error: "At least one topic is required" },
        { status: 400 },
      );
    }

    const ai = getVertexAI();

    if (!ai) {
      const fallbackIdeas = generateFallbackIdeas(topics, count);
      return NextResponse.json({ ideas: fallbackIdeas });
    }

    const model = ai.getGenerativeModel({ model: "gemini-2.0-flash" });

    const platformContext = getPlatformContext(contentPlatform);

    const prompt = `You are an expert content strategist and blog writer. Generate ${String(count)} unique, engaging blog post ideas based on the following topics: ${topics.join(", ")}.

${platformContext}

For each idea, provide:
1. A compelling title (catchy and SEO-friendly)
2. A brief description (2-3 sentences explaining what the post would cover)

Format your response as a JSON array with objects containing "title" and "description" fields.

Example format:
[
  {
    "title": "10 Essential Tips for Modern Web Development",
    "description": "Explore the latest trends and best practices in web development that every developer should know in 2024."
  }
]

Important:
- Make titles specific and actionable
- Include a mix of listicles, how-tos, and deep dives
- Consider SEO keywords naturally
- Ensure each idea is unique and valuable

Generate ${String(count)} ideas now (respond ONLY with the JSON array, no additional text):`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const firstCandidate = response.candidates?.[0];
    const content = firstCandidate?.content;
    const parts = content?.parts;
    const firstPart = parts?.[0];
    const text = firstPart?.text ?? "";

    const jsonMatch = /\[[\s\S]*\]/.exec(text);
    if (!jsonMatch) {
      throw new Error("Could not parse ideas from response");
    }

    const ideas = JSON.parse(jsonMatch[0]) as GeneratedIdea[];

    return NextResponse.json({ ideas });
  } catch {
    const fallbackIdeas = generateFallbackIdeas(
      requestData.topics.length > 0 ? requestData.topics : ["general"],
      requestData.count || 5,
    );
    return NextResponse.json({ ideas: fallbackIdeas });
  }
}

function getPlatformContext(platform: string): string {
  switch (platform) {
    case "RATECREATOR":
      return `Context: Content for RateCreator - a platform for discovering, reviewing, and rating content creators across social media platforms (YouTube, Twitter, Instagram, Reddit, TikTok, Twitch). Focus on creator economy topics, reviews, platform comparisons, and creator success stories.`;
    case "CREATOROPS":
      return `Context: Content for CreatorOps - a portal for content creators to manage their profiles, analytics, and audience engagement. Focus on creator tools, monetization strategies, audience growth, and creator business tips.`;
    case "DOCUMENTATION":
      return `Context: Documentation content - technical guides, API documentation, how-to articles, and reference materials for developers and users.`;
    default:
      return "";
  }
}

function generateFallbackIdeas(
  topics: string[],
  count: number,
): GeneratedIdea[] {
  const templates = [
    {
      prefix: "The Complete Guide to",
      suffix:
        "Everything you need to know about {topic}, from basics to advanced concepts.",
    },
    {
      prefix: "10 Best Practices for",
      suffix:
        "Discover the top strategies and techniques for mastering {topic} in your workflow.",
    },
    {
      prefix: "How to Get Started with",
      suffix:
        "A beginner-friendly introduction to {topic} with practical examples and tips.",
    },
    {
      prefix: "Common Mistakes to Avoid in",
      suffix:
        "Learn from others' experiences and avoid these pitfalls when working with {topic}.",
    },
    {
      prefix: "The Future of",
      suffix:
        "Explore upcoming trends and predictions for {topic} in the coming years.",
    },
    {
      prefix: "Why You Should Care About",
      suffix:
        "Understanding the importance and impact of {topic} in today's landscape.",
    },
    {
      prefix: "Essential Tools for",
      suffix:
        "A curated list of the best tools and resources to enhance your {topic} workflow.",
    },
  ];

  const ideas: GeneratedIdea[] = [];

  for (let i = 0; i < count && i < templates.length; i++) {
    const topic = topics[i % topics.length] ?? "general";
    const template = templates[i];
    ideas.push({
      title: `${template.prefix} ${topic}`,
      description: template.suffix.replace("{topic}", topic),
    });
  }

  return ideas;
}
