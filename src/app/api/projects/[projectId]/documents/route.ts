import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || "http://localhost:4000";

// GET all documents for a project
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) {
  try {
    const { userId, getToken } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = await getToken();
    const { projectId } = await context.params;
    
    const response = await fetch(`${API_GATEWAY_URL}/api/projects/${projectId}/documents`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    
    // Extract the actual documents from the service response
    if (data.success && data.data) {
      return NextResponse.json(data.data, { status: response.status });
    }
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }
}

// POST create a new document
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) {
  try {
    const { userId, getToken } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = await getToken();
    const { projectId } = await context.params;
    const body = await request.json();

    const response = await fetch(`${API_GATEWAY_URL}/api/projects/${projectId}/documents`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    // Extract the actual document from the service response
    if (data.success && data.data) {
      return NextResponse.json(data.data, { status: response.status });
    }
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error creating document:", error);
    return NextResponse.json({ error: "Failed to create document" }, { status: 500 });
  }
}
