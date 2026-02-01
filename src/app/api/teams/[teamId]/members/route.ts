import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const TEAM_SERVICE_URL = process.env.TEAM_SERVICE_URL || "http://localhost:3002";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { userId, getToken } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { teamId } = await params;
    const token = await getToken();
    const body = await request.json();
    
    const response = await fetch(`${TEAM_SERVICE_URL}/api/teams/${teamId}/members`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(errorData, { status: response.status });
    }

    const result = await response.json();
    return NextResponse.json(result.data || result);
  } catch (error) {
    console.error("Add member API error:", error);
    return NextResponse.json(
      { error: "Failed to add member" },
      { status: 500 }
    );
  }
}
