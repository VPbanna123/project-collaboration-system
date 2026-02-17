import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || "http://localhost:4000";

export async function GET(request: NextRequest) {
  try {
    const { userId, getToken } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = await getToken();
    
    // Get teamId from query params if provided
    const searchParams = request.nextUrl.searchParams;
    const teamId = searchParams.get("teamId");
    
    // Build URL with teamId filter if provided
    const url = teamId 
      ? `${API_GATEWAY_URL}/api/projects?teamId=${teamId}`
      : `${API_GATEWAY_URL}/api/projects`;
    
    console.log('[Next.js API] GET /api/projects - Calling API Gateway:', url);
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Project service error:", response.status, errorText);
      throw new Error("Failed to fetch projects");
    }

    const result = await response.json();
    console.log("Project service response:", result);
    const projects = result.data || result;
    
    // Ensure projects is an array
    if (!Array.isArray(projects)) {
      console.error("Projects is not an array:", projects);
      return NextResponse.json([]);
    }
    
    return NextResponse.json(projects);
  } catch (error) {
    console.error("Projects API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, getToken } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = await getToken();
    const body = await request.json();

    console.log('[Next.js API] POST /api/projects - Calling API Gateway');
    const response = await fetch(`${API_GATEWAY_URL}/api/projects`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error("Failed to create project");
    }

    const result = await response.json();
    const project = result.data || result;
    return NextResponse.json(project);
  } catch (error) {
    console.error("Projects API error:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
