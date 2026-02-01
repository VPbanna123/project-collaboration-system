import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const CHAT_SERVICE_URL = process.env.CHAT_SERVICE_URL || "http://localhost:3004";

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { userId, getToken } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = await getToken();
    const response = await fetch(
      `${CHAT_SERVICE_URL}/api/messages/${params.projectId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch messages");
    }

    const result = await response.json();
    const messages = result.data || result;
    return NextResponse.json(messages);
  } catch (error) {
    console.error("Messages API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}
