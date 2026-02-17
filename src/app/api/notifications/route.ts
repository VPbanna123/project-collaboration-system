import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || "http://localhost:4000";

export async function GET() {
  try {
    const { userId, getToken } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = await getToken();
    const response = await fetch(`${API_GATEWAY_URL}/api/notifications`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Notification service error:", response.status, errorText);
      throw new Error("Failed to fetch notifications");
    }

    const result = await response.json();
    console.log("Notification service response:", result);
    const notifications = result.data || result;
    
    // Ensure notifications is an array
    if (!Array.isArray(notifications)) {
      console.error("Notifications is not an array:", notifications);
      return NextResponse.json([]);
    }
    
    return NextResponse.json(notifications);
  } catch (error) {
    console.error("Notifications API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}
