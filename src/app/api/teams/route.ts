import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || "http://localhost:4000";

interface TeamMember {
  id: string;
  userId: string;
  role: string;
  user?: {
    id: string;
    name: string;
    email: string;
    imageUrl?: string;
  };
}

interface Team {
  id: string;
  name: string;
  description?: string;
  members?: TeamMember[];
}

export async function GET() {
  try {
    const { userId, getToken } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = await getToken();
    console.log('[Next.js API] GET /api/teams - Calling API Gateway');
    const response = await fetch(`${API_GATEWAY_URL}/api/teams`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Team service error:", response.status, errorText);
      throw new Error("Failed to fetch teams");
    }

    const result = await response.json();
    const teams = result.data || result;
    
    // Ensure teams is an array
    if (!Array.isArray(teams)) {
      console.error("Teams is not an array:", teams);
      return NextResponse.json({ success: true, data: [] });
    }
    
    // Fetch user details for members
    const teamsWithUserDetails = await Promise.all(
      teams.map(async (team: Team) => {
        if (team.members && team.members.length > 0) {
          // Fetch user details for all members
          const membersWithUsers = await Promise.all(
            team.members.map(async (member: TeamMember) => {
              try {
                const userResponse = await fetch(
                  `${API_GATEWAY_URL}/api/users/${member.userId}`,
                  {
                    headers: {
                      Authorization: `Bearer ${token}`,
                    },
                  }
                );
                
                if (userResponse.ok) {
                  const userData = await userResponse.json();
                  return {
                    ...member,
                    user: userData.data || userData,
                  };
                }
              } catch (error) {
                console.error(`Failed to fetch user ${member.userId}:`, error);
              }
              return member;
            })
          );
          
          return {
            ...team,
            members: membersWithUsers,
          };
        }
        return team;
      })
    );
    
    return NextResponse.json({ success: true, data: teamsWithUserDetails });
  } catch (error) {
    console.error("Teams API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch teams" },
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
    
    // Sync user first to ensure they exist in database
    try {
      const userSyncResponse = await fetch(`${API_GATEWAY_URL}/api/users/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ clerkId: userId }),
      });
      
      if (!userSyncResponse.ok) {
        console.error("Failed to sync user");
      }
    } catch (syncError) {
      console.error("User sync error:", syncError);
    }

    const body = await request.json();

    console.log('[Next.js API] POST /api/teams - Calling API Gateway');
    const response = await fetch(`${API_GATEWAY_URL}/api/teams`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error("Failed to create team");
    }

    const result = await response.json();
    const team = result.data || result;
    return NextResponse.json(team);
  } catch (error) {
    console.error("Teams API error:", error);
    return NextResponse.json(
      { error: "Failed to create team" },
      { status: 500 }
    );
  }
}
