import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createReview } from "@ratecreator/actions/review";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    // Check authentication
    const { userId } = auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get the request body
    const body = await req.json();

    // Create the review using the server action
    const result = await createReview(body);

    if (!result.success) {
      return new NextResponse(result.error, { status: 400 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("[REVIEWS_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
