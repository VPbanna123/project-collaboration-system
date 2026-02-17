import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';

const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:4000';

/**
 * GET /api/invitations
 * Fetch all pending invitations for the logged-in user
 */
export async function GET(req: NextRequest) {
  try {
    const { userId, getToken } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user details from Clerk
    const client = await clerkClient();
    const user = await client.users.getUser(userId);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const userEmail = user.emailAddresses?.[0]?.emailAddress;

    if (!userEmail) {
      return NextResponse.json(
        { success: false, error: 'User email not found' },
        { status: 400 }
      );
    }

    // Get auth token
    const token = await getToken();

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Failed to get authentication token' },
        { status: 401 }
      );
    }

    // Fetch invitations from team service via API Gateway
    const response = await fetch(
      `${API_GATEWAY_URL}/api/teams/invitations/my?email=${encodeURIComponent(userEmail)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] Team service error:', response.status, errorText);
      
      // Return empty array if service is unavailable or user has no invitations
      if (response.status === 404 || response.status === 500) {
        return NextResponse.json({
          success: true,
          data: [],
        });
      }
      
      throw new Error(`Failed to fetch invitations: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      data: data.data || data || [],
    });
  } catch (error) {
    console.error('[API] Error fetching invitations:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch invitations';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
