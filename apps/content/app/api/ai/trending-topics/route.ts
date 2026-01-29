import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { VertexAI } from "@google-cloud/vertexai";

interface TrendingTopicsRequest {
  category?: string;
  region?: string;
  timeframe?: "today" | "week" | "month" | "year";
}

interface TrendingTopic {
  topic: string;
  trendScore: number;
  growth: string;
  category: string;
  searchVolume: string;
  relatedQueries: string[];
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
  let requestData: TrendingTopicsRequest = {};

  try {
    requestData = (await request.json()) as TrendingTopicsRequest;
    const { category, region = "US", timeframe = "week" } = requestData;

    const ai = getVertexAI();

    if (!ai) {
      const fallbackTrends = generateFallbackTrends(category);
      return NextResponse.json({ trends: fallbackTrends });
    }

    const model = ai.getGenerativeModel({ model: "gemini-2.0-flash" });

    const categoryFilter = category
      ? `specifically in the "${category}" niche`
      : "across technology, business, and the creator economy";
    const timeframeMap: Record<string, string> = {
      today: "today",
      week: "the past week",
      month: "the past month",
      year: "the past year",
    };

    const prompt = `You are a trend analyst with access to current search and social media trends. Based on your knowledge of trending topics and search patterns as of your training data, identify the most relevant trending topics ${categoryFilter} in ${region} over ${timeframeMap[timeframe]}.

Generate 15 trending topics that would be great for blog content about content creators, the creator economy, and technology. For each topic, provide:
1. topic: The trending topic name
2. trendScore: A score from 1-100 indicating relative trend strength
3. growth: Growth indicator (e.g., "+250%", "Stable", "Rising")
4. category: The category it belongs to
5. searchVolume: Estimated search volume (e.g., "High", "Medium", "Very High")
6. relatedQueries: 3-4 related search queries people are making

Format as JSON array:
[
  {
    "topic": "AI Content Creation",
    "trendScore": 95,
    "growth": "+320%",
    "category": "Technology",
    "searchVolume": "Very High",
    "relatedQueries": ["AI writing tools", "content automation", "AI for creators"]
  }
]

Focus on:
- Topics with genuine current interest
- Topics suitable for in-depth blog posts
- Mix of breaking trends and growing sustained interest
- Topics relevant to content creators and tech-savvy audience

Generate 15 trending topics now (respond ONLY with the JSON array):`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const firstCandidate = response.candidates?.[0];
    const content = firstCandidate?.content;
    const parts = content?.parts;
    const firstPart = parts?.[0];
    const text = firstPart?.text ?? "";

    const jsonMatch = /\[[\s\S]*\]/.exec(text);
    if (!jsonMatch) {
      throw new Error("Could not parse trends from response");
    }

    const trends = JSON.parse(jsonMatch[0]) as TrendingTopic[];

    return NextResponse.json({ trends });
  } catch {
    const fallbackTrends = generateFallbackTrends(requestData.category);
    return NextResponse.json({ trends: fallbackTrends });
  }
}

function generateFallbackTrends(category?: string): TrendingTopic[] {
  const defaultTrends: TrendingTopic[] = [
    {
      topic: "AI Agents",
      trendScore: 95,
      growth: "+450%",
      category: "Technology",
      searchVolume: "Very High",
      relatedQueries: ["AI agent frameworks", "autonomous AI", "AI assistant"],
    },
    {
      topic: "Creator Economy Growth",
      trendScore: 92,
      growth: "+300%",
      category: "Creator Economy",
      searchVolume: "Very High",
      relatedQueries: [
        "creator monetization",
        "influencer marketing",
        "content creator tools",
      ],
    },
    {
      topic: "Claude AI",
      trendScore: 90,
      growth: "+280%",
      category: "Technology",
      searchVolume: "High",
      relatedQueries: ["Claude vs GPT", "Anthropic Claude", "Claude API"],
    },
    {
      topic: "Next.js 15",
      trendScore: 85,
      growth: "+150%",
      category: "Web Development",
      searchVolume: "High",
      relatedQueries: [
        "Next.js features",
        "React Server Components",
        "App Router",
      ],
    },
    {
      topic: "Short-Form Video Strategy",
      trendScore: 88,
      growth: "+200%",
      category: "Creator Economy",
      searchVolume: "High",
      relatedQueries: [
        "TikTok strategy",
        "YouTube Shorts",
        "Instagram Reels tips",
      ],
    },
    {
      topic: "RAG Systems",
      trendScore: 88,
      growth: "+200%",
      category: "AI/ML",
      searchVolume: "High",
      relatedQueries: ["RAG vs fine-tuning", "vector databases", "LangChain"],
    },
    {
      topic: "Creator Analytics Tools",
      trendScore: 82,
      growth: "+160%",
      category: "Creator Economy",
      searchVolume: "High",
      relatedQueries: [
        "social media analytics",
        "audience insights",
        "creator dashboard",
      ],
    },
    {
      topic: "Edge Computing",
      trendScore: 80,
      growth: "+120%",
      category: "Infrastructure",
      searchVolume: "High",
      relatedQueries: ["edge functions", "Cloudflare Workers", "Vercel Edge"],
    },
    {
      topic: "Rust Programming",
      trendScore: 78,
      growth: "+95%",
      category: "Programming",
      searchVolume: "Medium",
      relatedQueries: ["Rust vs Go", "learn Rust", "Rust for web"],
    },
    {
      topic: "Tailwind CSS v4",
      trendScore: 72,
      growth: "+110%",
      category: "Web Development",
      searchVolume: "Medium",
      relatedQueries: [
        "Tailwind new features",
        "CSS frameworks",
        "utility CSS",
      ],
    },
    {
      topic: "Local LLMs",
      trendScore: 85,
      growth: "+250%",
      category: "AI/ML",
      searchVolume: "High",
      relatedQueries: ["Ollama", "Llama 3", "run LLM locally"],
    },
    {
      topic: "Developer Productivity",
      trendScore: 75,
      growth: "Stable",
      category: "Career",
      searchVolume: "Medium",
      relatedQueries: ["dev tools", "coding efficiency", "workflow automation"],
    },
    {
      topic: "Platform Engineering",
      trendScore: 82,
      growth: "+160%",
      category: "DevOps",
      searchVolume: "High",
      relatedQueries: [
        "internal developer platform",
        "DevOps vs Platform",
        "IDP",
      ],
    },
    {
      topic: "Monorepos",
      trendScore: 70,
      growth: "+75%",
      category: "Development",
      searchVolume: "Medium",
      relatedQueries: ["Turborepo", "Nx", "monorepo vs polyrepo"],
    },
    {
      topic: "AI Code Review",
      trendScore: 78,
      growth: "+200%",
      category: "DevTools",
      searchVolume: "Medium",
      relatedQueries: [
        "automated code review",
        "AI PR review",
        "code quality AI",
      ],
    },
  ];

  if (category) {
    return defaultTrends.filter((t) =>
      t.category.toLowerCase().includes(category.toLowerCase()),
    );
  }

  return defaultTrends;
}
