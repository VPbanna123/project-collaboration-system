import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const PROJECT_SERVICE_URL = process.env.PROJECT_SERVICE_URL || "http://localhost:3003";

// GET all documents from all projects in a team
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ teamId: string }> }
) {
  try {
    const { userId, getToken } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = await getToken();
    const { teamId } = await context.params;
    
    // First, get all projects for this team
    const projectsResponse = await fetch(`${PROJECT_SERVICE_URL}/api/projects?teamId=${teamId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!projectsResponse.ok) {
      return NextResponse.json({ error: "Failed to fetch team projects" }, { status: 500 });
    }

    const projectsData = await projectsResponse.json();
    const projects = projectsData.data || projectsData || [];

    // Fetch documents from all projects
    interface DocumentWithProject {
      id: string;
      title: string;
      content: string;
      projectId: string;
      createdBy: string;
      createdAt: string;
      updatedAt: string;
      projectName: string;
    }

    const allDocuments: DocumentWithProject[] = [];
    for (const project of projects) {
      try {
        const docsResponse = await fetch(`${PROJECT_SERVICE_URL}/api/projects/${project.id}/documents`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (docsResponse.ok) {
          const docsData = await docsResponse.json();
          const docs = docsData.data || docsData || [];
          
          // Add project info to each document
          docs.forEach((doc: Record<string, unknown>) => {
            allDocuments.push({
              ...doc,
              projectName: project.name,
              projectId: project.id,
            } as DocumentWithProject);
          });
        }
      } catch (error) {
        console.error(`Error fetching documents for project ${project.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      data: allDocuments,
    });
  } catch (error) {
    console.error("Error fetching team documents:", error);
    return NextResponse.json({ error: "Failed to fetch team documents" }, { status: 500 });
  }
}
