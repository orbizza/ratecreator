import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { VertexAI } from "@google-cloud/vertexai";

interface TopicSuggestionRequest {
  category?: string;
  existingTopics?: string[];
  count?: number;
}

interface TopicSuggestion {
  topic: string;
  description: string;
  relevanceScore: number;
  relatedKeywords: string[];
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
  let requestData: TopicSuggestionRequest = {};

  try {
    requestData = (await request.json()) as TopicSuggestionRequest;
    const { category, existingTopics = [], count = 10 } = requestData;

    const ai = getVertexAI();

    if (!ai) {
      const fallbackTopics = generateFallbackTopics(category, count);
      return NextResponse.json({ topics: fallbackTopics });
    }

    const model = ai.getGenerativeModel({ model: "gemini-2.0-flash" });

    const existingTopicsStr =
      existingTopics.length > 0
        ? `\n\nExclude these topics as they already exist: ${existingTopics.join(", ")}`
        : "";

    const categoryStr = category
      ? `in the "${category}" category`
      : "across technology, creator economy, and content creation";

    const prompt = `You are an expert content strategist and trend analyst. Suggest ${String(count)} trending and engaging blog topics ${categoryStr} that would be valuable for a content platform focused on discovering, reviewing, and rating content creators.
${existingTopicsStr}

For each topic suggestion, provide:
1. topic: A concise topic name (2-5 words)
2. description: Brief explanation of why this topic is relevant (1 sentence)
3. relevanceScore: A score from 1-10 indicating how trending/relevant this topic is
4. relatedKeywords: 3-5 related keywords for SEO

Format your response as a JSON array:
[
  {
    "topic": "AI Content Creation",
    "description": "Explore how AI is transforming content creation workflows for creators",
    "relevanceScore": 9,
    "relatedKeywords": ["AI tools", "content automation", "creator productivity"]
  }
]

Focus on:
- Current trends in 2024-2025
- Topics with good search volume
- Evergreen topics with lasting value
- Mix of technical and creator-focused topics

Generate ${String(count)} topic suggestions now (respond ONLY with the JSON array, no additional text):`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const firstCandidate = response.candidates?.[0];
    const content = firstCandidate?.content;
    const parts = content?.parts;
    const firstPart = parts?.[0];
    const text = firstPart?.text ?? "";

    const jsonMatch = /\[[\s\S]*\]/.exec(text);
    if (!jsonMatch) {
      throw new Error("Could not parse topics from response");
    }

    const topics = JSON.parse(jsonMatch[0]) as TopicSuggestion[];

    return NextResponse.json({ topics });
  } catch {
    const fallbackTopics = generateFallbackTopics(
      requestData.category,
      requestData.count || 10,
    );
    return NextResponse.json({ topics: fallbackTopics });
  }
}

function generateFallbackTopics(
  category?: string,
  count = 10,
): TopicSuggestion[] {
  const defaultTopics: TopicSuggestion[] = [
    {
      topic: "AI in Content Creation",
      description:
        "How artificial intelligence is transforming how creators produce and distribute content",
      relevanceScore: 9,
      relatedKeywords: ["AI", "automation", "content tools", "creator economy"],
    },
    {
      topic: "Creator Monetization",
      description:
        "New revenue streams and monetization strategies for content creators",
      relevanceScore: 9,
      relatedKeywords: [
        "monetization",
        "revenue",
        "sponsorships",
        "subscriptions",
      ],
    },
    {
      topic: "Platform Algorithm Changes",
      description:
        "Understanding how algorithm updates affect creator visibility and reach",
      relevanceScore: 8,
      relatedKeywords: ["algorithm", "reach", "engagement", "social media"],
    },
    {
      topic: "Web Development Trends",
      description: "Latest frameworks and tools shaping modern web development",
      relevanceScore: 8,
      relatedKeywords: ["React", "Next.js", "frontend", "full-stack"],
    },
    {
      topic: "Personal Branding",
      description: "Building a strong personal brand as a content creator",
      relevanceScore: 7,
      relatedKeywords: ["branding", "identity", "audience", "niche"],
    },
    {
      topic: "Cloud Computing",
      description:
        "Understanding cloud services and their impact on creator tools",
      relevanceScore: 7,
      relatedKeywords: ["AWS", "cloud", "infrastructure", "DevOps"],
    },
    {
      topic: "Content Analytics",
      description: "Using data and analytics to optimize content performance",
      relevanceScore: 8,
      relatedKeywords: ["analytics", "metrics", "performance", "insights"],
    },
    {
      topic: "Video Production Tools",
      description:
        "Tools and techniques for creating professional video content",
      relevanceScore: 8,
      relatedKeywords: ["video", "editing", "production", "YouTube"],
    },
    {
      topic: "Community Building",
      description:
        "Strategies for building and nurturing engaged creator communities",
      relevanceScore: 7,
      relatedKeywords: ["community", "engagement", "Discord", "membership"],
    },
    {
      topic: "Cross-Platform Strategy",
      description:
        "How creators can effectively distribute content across multiple platforms",
      relevanceScore: 8,
      relatedKeywords: [
        "multi-platform",
        "distribution",
        "repurposing",
        "syndication",
      ],
    },
  ];

  return defaultTopics.slice(0, count);
}
