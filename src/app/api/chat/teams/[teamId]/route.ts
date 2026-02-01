import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const CHAT_SERVICE_URL = process.env.CHAT_SERVICE_URL || "http://localhost:3004";

// GET team chat messages
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { userId, getToken } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = await getToken();
    const { teamId } = await params;
    
    const response = await fetch(
      `${CHAT_SERVICE_URL}/api/teams/${teamId}/messages`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error fetching team messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch team messages" },
      { status: 500 }
    );
  }
}

// POST - Send team chat message
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { userId, getToken } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = await getToken();
    const { teamId } = await params;
    const body = await request.json();
    
    const response = await fetch(
      `${CHAT_SERVICE_URL}/api/teams/${teamId}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error sending team message:", error);
    return NextResponse.json(
      { error: "Failed to send team message" },
      { status: 500 }
    );
  }
}
