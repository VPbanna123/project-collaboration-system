import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || "http://localhost:4000";

// GET document edit history
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ documentId: string }> }
) {
  try {
    const { userId, getToken } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = await getToken();
    const { documentId } = await context.params;
    
    const response = await fetch(`${API_GATEWAY_URL}/api/documents/${documentId}/edits`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    
    // Extract the actual edits from the service response
    if (data.success && data.data) {
      return NextResponse.json(data.data, { status: response.status });
    }
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error fetching document edits:", error);
    return NextResponse.json({ error: "Failed to fetch document edits" }, { status: 500 });
  }
}
