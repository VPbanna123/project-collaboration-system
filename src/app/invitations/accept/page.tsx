"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  team: {
    id: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
  };
  createdAt: string;
  expiresAt: string;
}

export default function AcceptInvitationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoaded } = useUser();
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<Invitation | null>(null);

  const invitationId = searchParams.get("id");

  useEffect(() => {
    if (!isLoaded) return;

    if (!user) {
      // Redirect to sign in with return URL
      router.push(`/sign-in?redirect_url=/invitations/accept?id=${invitationId}`);
      return;
    }

    if (!invitationId) {
      setError("No invitation ID provided");
      setLoading(false);
      return;
    }

    // Fetch user's invitations
    fetchInvitation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user, invitationId]);

  const fetchInvitation = async () => {
    try {
      const response = await fetch("/api/invitations");
      
      if (!response.ok) {
        throw new Error("Failed to fetch invitations");
      }
      
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch invitations");
      }

      // Find the specific invitation
      const foundInvitation = data.data?.find((inv: Invitation) => inv.id === invitationId);

      if (!foundInvitation) {
        setError("Invitation not found or has expired");
      } else {
        setInvitation(foundInvitation);
      }
    } catch (err) {
      console.error("Error fetching invitation:", err);
      setError(err instanceof Error ? err.message : "Failed to load invitation");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!invitationId) return;

    setAccepting(true);
    setError(null);

    try {
      const response = await fetch(`/api/invitations/${invitationId}/accept`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to accept invitation");
      }

      // Redirect to teams page
      router.push("/teams?invitation=accepted");
    } catch (err) {
      console.error("Error accepting invitation:", err);
      setError(err instanceof Error ? err.message : "Failed to accept invitation");
    } finally {
      setAccepting(false);
    }
  };

  const handleDecline = async () => {
    if (!invitationId) return;

    setAccepting(true);
    setError(null);

    try {
      const response = await fetch(`/api/invitations/${invitationId}/accept`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to decline invitation");
      }

      // Redirect to teams page
      router.push("/teams?invitation=declined");
    } catch (err) {
      console.error("Error declining invitation:", err);
      setError(err instanceof Error ? err.message : "Failed to decline invitation");
    } finally {
      setAccepting(false);
    }
  };

  if (loading || !isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Error</h3>
            <p className="mt-2 text-sm text-gray-500">{error}</p>
            <div className="mt-6">
              <button
                onClick={() => router.push("/teams")}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Go to Teams
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900">Invitation not found</h3>
            <p className="mt-2 text-sm text-gray-500">
              This invitation may have expired or has already been accepted.
            </p>
            <div className="mt-6">
              <button
                onClick={() => router.push("/teams")}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Go to Teams
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          {invitation.team.imageUrl ? (
            <Image
              src={invitation.team.imageUrl}
              alt={invitation.team.name}
              width={64}
              height={64}
              className="mx-auto rounded-full"
            />
          ) : (
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-indigo-100">
              <svg
                className="h-8 w-8 text-indigo-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
          )}
        </div>

        <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
          Team Invitation
        </h2>

        <p className="text-center text-gray-600 mb-6">
          You&apos;ve been invited to join <strong>{invitation.team.name}</strong>
        </p>

        {invitation.team.description && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-700">{invitation.team.description}</p>
          </div>
        )}

        <div className="border-t border-b border-gray-200 py-4 mb-6">
          <dl className="space-y-2">
            <div className="flex justify-between text-sm">
              <dt className="text-gray-500">Role</dt>
              <dd className="font-medium text-gray-900">{invitation.role}</dd>
            </div>
            <div className="flex justify-between text-sm">
              <dt className="text-gray-500">Expires</dt>
              <dd className="font-medium text-gray-900">
                {new Date(invitation.expiresAt).toLocaleDateString()}
              </dd>
            </div>
          </dl>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="flex space-x-3">
          <button
            onClick={handleDecline}
            disabled={accepting}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Decline
          </button>
          <button
            onClick={handleAccept}
            disabled={accepting}
            className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {accepting ? "Processing..." : "Accept Invitation"}
          </button>
        </div>
      </div>
    </div>
  );
}
