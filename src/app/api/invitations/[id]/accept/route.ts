import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';

const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:4000';

/**
 * POST /api/invitations/[id]/accept
 * Accept a team invitation
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, getToken } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: invitationId } = await params;

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

    // Accept invitation via team service
    const response = await fetch(
      `${API_GATEWAY_URL}/api/teams/invitations/${invitationId}/accept`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { success: false, error: errorData.error || 'Failed to accept invitation' },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      message: 'Invitation accepted successfully',
      data,
    });
  } catch (error) {
    console.error('[API] Error accepting invitation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to accept invitation' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/invitations/[id]/decline
 * Decline a team invitation
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, getToken } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: invitationId } = await params;

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

    // Decline invitation via team service
    const response = await fetch(
      `${API_GATEWAY_URL}/api/teams/invitations/${invitationId}/decline`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { success: false, error: errorData.error || 'Failed to decline invitation' },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      message: 'Invitation declined',
      data,
    });
  } catch (error) {
    console.error('[API] Error declining invitation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to decline invitation' },
      { status: 500 }
    );
  }
}
