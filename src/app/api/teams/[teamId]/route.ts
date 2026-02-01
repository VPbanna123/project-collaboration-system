import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const TEAM_SERVICE_URL = process.env.TEAM_SERVICE_URL || "http://localhost:3002";
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || "http://localhost:3001";

interface TeamMember {
  id: string;
  userId: string;
  role: string;
  teamId: string;
  joinedAt: string;
}

interface User {
  id: string;
  clerkId: string;
  email: string;
  name: string | null;
}

interface TeamData {
  id: string;
  name: string;
  description: string | null;
  createdById: string;
  createdAt: string;
  members?: TeamMember[];
}

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
    
    // Fetch team data
    const response = await fetch(`${TEAM_SERVICE_URL}/api/teams/${teamId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Team service error:", response.status, errorText);
      
      if (response.status === 404) {
        return NextResponse.json({ error: "Team not found" }, { status: 404 });
      }
      
      throw new Error("Failed to fetch team");
    }

    const result = await response.json();
    const team = result.data || result as TeamData;
    
    // Fetch user data for all members
    if (team.members && team.members.length > 0) {
      const userIds = team.members.map((m: TeamMember) => m.userId);
      const uniqueUserIds = [...new Set(userIds)];
      
      // Fetch users in parallel
      const userPromises = uniqueUserIds.map(async (uid) => {
        try {
          const userRes = await fetch(`${USER_SERVICE_URL}/api/users/${uid}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (userRes.ok) {
            const userData = await userRes.json();
            return { userId: uid, user: userData.data || userData };
          }
        } catch (err) {
          console.error(`Failed to fetch user ${uid}:`, err);
        }
        return { userId: uid, user: null };
      });
      
      const users = await Promise.all(userPromises);
      const userMap: Record<string, User | null> = Object.fromEntries(users.map(u => [u.userId, u.user]));
      
      // Attach user data to members
      team.members = team.members.map((member: TeamMember) => ({
        ...member,
        user: userMap[member.userId] || null,
      }));
    }
    
    return NextResponse.json(team);
  } catch (error) {
    console.error("Team API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch team" },
      { status: 500 }
    );
  }
}

export async function PUT(
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
    
    const response = await fetch(`${TEAM_SERVICE_URL}/api/teams/${teamId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error("Failed to update team");
    }

    const result = await response.json();
    const team = result.data || result;
    
    return NextResponse.json(team);
  } catch (error) {
    console.error("Team update API error:", error);
    return NextResponse.json(
      { error: "Failed to update team" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    
    const response = await fetch(`${TEAM_SERVICE_URL}/api/teams/${teamId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to delete team");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Team delete API error:", error);
    return NextResponse.json(
      { error: "Failed to delete team" },
      { status: 500 }
    );
  }
}
