import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const CHAT_SERVICE_URL = process.env.CHAT_SERVICE_URL || "http://localhost:3004";

// POST - Mark messages as read
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { userId, getToken } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = await getToken();
    const { conversationId } = await context.params;
    
    const response = await fetch(`${CHAT_SERVICE_URL}/api/conversations/${conversationId}/read`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    return NextResponse.json({ error: "Failed to mark as read" }, { status: 500 });
  }
}
