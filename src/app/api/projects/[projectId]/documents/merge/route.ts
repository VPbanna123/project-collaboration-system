import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || "http://localhost:4000";

// POST merge multiple documents
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) {
  try {
    const { userId, getToken } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = await getToken();
    const { projectId } = await context.params;
    const body = await request.json();

    console.log(`[Next.js Proxy] Merging documents for project ${projectId}`);

    const response = await fetch(`${API_GATEWAY_URL}/api/projects/${projectId}/documents/merge`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error merging documents:", error);
    return NextResponse.json({ error: "Failed to merge documents" }, { status: 500 });
  }
}
