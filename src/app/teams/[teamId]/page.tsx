"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";

interface Team {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  createdById: string;
  members: Array<{
    id: string;
    userId: string;
    role: string;
    user: {
      id: string;
      clerkId: string;
      email: string;
      name: string | null;
    } | null;
  }>;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  status?: string;
  createdAt: string;
}

export default function TeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const teamId = params.teamId as string;
  
  const [team, setTeam] = useState<Team | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("MEMBER");
  const [showInvite, setShowInvite] = useState(false);
  const [activeTab, setActiveTab] = useState<"members" | "projects">("members");
  const [sendingInvite, setSendingInvite] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [removingMember, setRemovingMember] = useState<string | null>(null);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchTeam = async () => {
      try {
        const response = await fetch(`/api/teams/${teamId}`);

        if (!response.ok) {
          throw new Error("Failed to fetch team");
        }

        const teamData = await response.json();
        setTeam(teamData);
        setEditName(teamData.name);
        setEditDescription(teamData.description || "");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load team");
      } finally {
        setLoading(false);
      }
    };

    const fetchProjects = async () => {
      try {
        const response = await fetch(`/api/projects?teamId=${teamId}`);
        if (response.ok) {
          const data = await response.json();
          setProjects(data.projects || data || []);
        }
      } catch (err) {
        console.error("Failed to fetch team projects:", err);
      }
    };

    fetchTeam();
    fetchProjects();
  }, [teamId, user]);

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      const response = await fetch(`/api/teams/${teamId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, description: editDescription }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update team");
      }

      const teamData = await response.json();
      setTeam(teamData);
      setEditName(teamData.name);
      setEditDescription(teamData.description || "");
      setIsEditing(false);
      toast.success("Team updated successfully!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update team");
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this team?")) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/teams/${teamId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete team");
      }

      toast.success("Team deleted successfully!");
      router.push("/teams");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete team");
      setDeleting(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Remove this member from the team?")) return;

    setRemovingMember(memberId);
    try {
      const response = await fetch(`/api/teams/${teamId}/members/${memberId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to remove member");
      }

      const refreshResponse = await fetch(`/api/teams/${teamId}`);
      if (refreshResponse.ok) {
        const teamData = await refreshResponse.json();
        setTeam(teamData);
      }
      toast.success("Member removed successfully!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove member");
    } finally {
      setRemovingMember(null);
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    setUpdatingRole(memberId);
    try {
      const response = await fetch(`/api/teams/${teamId}/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update role");
      }

      const refreshResponse = await fetch(`/api/teams/${teamId}`);
      if (refreshResponse.ok) {
        const teamData = await refreshResponse.json();
        setTeam(teamData);
      }
      toast.success("Role updated successfully!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update role");
    } finally {
      setUpdatingRole(null);
    }
  };

  const handleSendInvite = async () => {
    if (!inviteEmail.trim()) {
      toast.error("Please enter an email address");
      return;
    }
    
    setSendingInvite(true);
    try {
      const response = await fetch(`/api/teams/${teamId}/invitations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });

      const error = await response.json();
      
      if (!response.ok) {
        // Check if it's an "already sent" error
        if (error.error && error.error.includes("already sent")) {
          toast.warning("An invitation has already been sent to this email");
          setInviteEmail("");
          setShowInvite(false);
          return;
        }
        throw new Error(error.error || "Failed to send invitation");
      }

      setInviteEmail("");
      setShowInvite(false);
      toast.success("Invitation sent successfully!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send invitation");
    } finally {
      setSendingInvite(false);
    }
  };

  const isAdmin = team?.members.find(m => m.user?.clerkId === user?.id)?.role === "ADMIN";
  // Find current user's database ID from members to check ownership
  const currentUserDbId = team?.members.find(m => m.user?.clerkId === user?.id)?.userId;
  const isOwner = team?.createdById === currentUserDbId;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Team Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error || "This team doesn't exist"}</p>
          <button
            onClick={() => router.push("/teams")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Teams
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/teams")}
            className="text-blue-600 dark:text-blue-400 hover:underline mb-4"
          >
            ← Back to Teams
          </button>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            {isEditing ? (
              <div className="space-y-4">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Team name"
                />
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Team description"
                  rows={3}
                />
                <div className="flex gap-2">
                  <button onClick={handleUpdate} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Save
                  </button>
                  <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white rounded-lg">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{team.name}</h1>
                    {team.description && (
                      <p className="text-gray-600 dark:text-gray-400">{team.description}</p>
                    )}
                  </div>
                  {isAdmin && (
                    <div className="flex gap-2">
                      <button onClick={() => setIsEditing(true)} className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        Edit
                      </button>
                      {isOwner && (
                        <button onClick={handleDelete} className="px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">
                          Delete
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
          <button
            onClick={() => setActiveTab("members")}
            className={`px-6 py-3 font-medium text-sm ${
              activeTab === "members"
                ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            Members ({team.members.length})
          </button>
          <button
            onClick={() => setActiveTab("projects")}
            className={`px-6 py-3 font-medium text-sm ${
              activeTab === "projects"
                ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            Projects ({projects.length})
          </button>
        </div>

        {/* Members Section */}
        {activeTab === "members" && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Team Members ({team.members.length})
            </h2>
            {isAdmin && (
              <button
                onClick={() => setShowInvite(!showInvite)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
              >
                + Invite Member
              </button>
            )}
          </div>

          {showInvite && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h3 className="font-medium text-gray-900 dark:text-white mb-3">Send Invitation</h3>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="MEMBER">Member</option>
                  <option value="ADMIN">Admin</option>
                </select>
                <button onClick={handleSendInvite} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Send
                </button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {team.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {member.user?.name?.charAt(0).toUpperCase() || member.user?.email?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {member.user?.name || member.user?.email || "Unknown User"}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{member.user?.email || ""}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {isAdmin ? (
                    <select
                      value={member.role}
                      onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                      className="px-3 py-1 rounded-lg text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="MEMBER">Member</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  ) : (
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      member.role === "ADMIN" 
                        ? "bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200"
                        : "bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200"
                    }`}>
                      {member.role}
                    </span>
                  )}
                  {isAdmin && member.userId !== team.createdById && (
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="text-red-600 dark:text-red-400 hover:underline text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        )}

        {/* Projects Section */}
        {activeTab === "projects" && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Team Projects ({projects.length})
              </h2>
              <button
                onClick={() => router.push(`/projects?teamId=${teamId}`)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                + New Project
              </button>
            </div>

            {projects.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-500 dark:text-gray-400 mb-4">No projects yet for this team</p>
                <button
                  onClick={() => router.push(`/projects?teamId=${teamId}`)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create First Project
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    onClick={() => router.push(`/projects/${project.id}`)}
                    className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:shadow-md transition-shadow cursor-pointer border border-gray-200 dark:border-gray-600"
                  >
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{project.name}</h3>
                    {project.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">{project.description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        project.status === "COMPLETED" ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200" :
                        project.status === "IN_PROGRESS" ? "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200" :
                        project.status === "ON_HOLD" ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200" :
                        "bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200"
                      }`}>
                        {project.status ? project.status.replace("_", " ") : "Not Set"}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(project.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
