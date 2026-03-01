import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || "http://localhost:4000";

// GET download document
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ documentId: string }> }
) {
  try {
    const { userId, getToken } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = await getToken();
    const { documentId } = await context.params;

    console.log(`[Next.js Proxy] Downloading document ${documentId}`);

    const response = await fetch(`${API_GATEWAY_URL}/api/documents/${documentId}/download`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Failed to download document" }));
      return NextResponse.json(error, { status: response.status });
    }

    // Get the file content
    const content = await response.text();
    
    // Get headers from the backend response
    const contentType = response.headers.get('Content-Type') || 'text/markdown';
    const contentDisposition = response.headers.get('Content-Disposition') || `attachment; filename="document.md"`;

    // Return the file with proper headers
    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': contentDisposition,
      },
    });
  } catch (error) {
    console.error("Error downloading document:", error);
    return NextResponse.json({ error: "Failed to download document" }, { status: 500 });
  }
}
