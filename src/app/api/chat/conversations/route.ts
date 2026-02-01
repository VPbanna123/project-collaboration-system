import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const CHAT_SERVICE_URL = process.env.CHAT_SERVICE_URL || "http://localhost:3004";

// GET all conversations for current user
export async function GET(request: NextRequest) {
  try {
    const { userId, getToken } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = await getToken();
    
    const response = await fetch(`${CHAT_SERVICE_URL}/api/conversations`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 });
  }
}

// POST - Start new conversation
export async function POST(request: NextRequest) {
  try {
    const { userId, getToken } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = await getToken();
    const body = await request.json();
    
    const response = await fetch(`${CHAT_SERVICE_URL}/api/conversations/start`, {
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
    console.error("Error starting conversation:", error);
    return NextResponse.json({ error: "Failed to start conversation" }, { status: 500 });
  }
}
