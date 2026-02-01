import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const TEAM_SERVICE_URL = process.env.TEAM_SERVICE_URL || "http://localhost:3002";

export async function GET(
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
    
    const response = await fetch(`${TEAM_SERVICE_URL}/api/teams/${teamId}/invitations`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch invitations");
    }

    const result = await response.json();
    return NextResponse.json(result.data || result);
  } catch (error) {
    console.error("Get invitations API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch invitations" },
      { status: 500 }
    );
  }
}

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
    
    const response = await fetch(`${TEAM_SERVICE_URL}/api/teams/${teamId}/invitations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Team service invitation error:", {
        status: response.status,
        error: errorData,
        teamId,
        body
      });
      return NextResponse.json(errorData, { status: response.status });
    }

    const result = await response.json();
    return NextResponse.json(result.data || result);
  } catch (error) {
    console.error("Send invitation API error:", error);
    return NextResponse.json(
      { error: "Failed to send invitation" },
      { status: 500 }
    );
  }
}
