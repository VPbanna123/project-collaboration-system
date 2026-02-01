import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const CHAT_SERVICE_URL = process.env.CHAT_SERVICE_URL || "http://localhost:3004";

export async function POST(request: NextRequest) {
  try {
    const { userId, getToken } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = await getToken();
    const body = await request.json();

    const response = await fetch(`${CHAT_SERVICE_URL}/api/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error("Failed to send message");
    }

    const result = await response.json();
    const message = result.data || result;
    return NextResponse.json(message);
  } catch (error) {
    console.error("Messages API error:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
