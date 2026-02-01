import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || "http://localhost:3001";

// GET - Search users by name or email
export async function GET(request: NextRequest) {
  try {
    const { userId, getToken } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = await getToken();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || query.length < 2) {
      return NextResponse.json({ 
        success: true, 
        data: [] 
      });
    }
    
    const response = await fetch(
      `${USER_SERVICE_URL}/api/users/internal/search?q=${encodeURIComponent(query)}&excludeUserId=${userId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("User service error:", response.status, errorText);
      return NextResponse.json({ 
        success: true, 
        data: [] 
      });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error searching users:", error);
    return NextResponse.json({ error: "Failed to search users" }, { status: 500 });
  }
}
