import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || "http://localhost:3001";

// GET user by Clerk ID
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId: currentUserId, getToken } = await auth();
    if (!currentUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = await getToken();
    const { userId } = await context.params;
    
    const response = await fetch(`${USER_SERVICE_URL}/api/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      throw new Error("Failed to fetch user");
    }

    const data = await response.json();
    return NextResponse.json(data.data || data);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}
