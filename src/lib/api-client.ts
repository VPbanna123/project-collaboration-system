import { auth } from "@clerk/nextjs/server";

const API_BASE_URLS = {
  user: process.env.USER_SERVICE_URL || "http://localhost:3001",
  team: process.env.TEAM_SERVICE_URL || "http://localhost:3002",
  project: process.env.PROJECT_SERVICE_URL || "http://localhost:3003",
  chat: process.env.CHAT_SERVICE_URL || "http://localhost:3004",
  notification: process.env.NOTIFICATION_SERVICE_URL || "http://localhost:3005",
};

type ServiceName = keyof typeof API_BASE_URLS;

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
}

async function apiRequest<T>(
  service: ServiceName,
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { userId, getToken } = await auth();
  
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const token = await getToken();
  const baseUrl = API_BASE_URLS[service];
  
  // Build URL with query params
  let url = `${baseUrl}${endpoint}`;
  if (options.params) {
    const searchParams = new URLSearchParams();
    Object.entries(options.params).forEach(([key, value]) => {
      searchParams.append(key, String(value));
    });
    url += `?${searchParams.toString()}`;
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

// User Service API
export const userApi = {
  getProfile: () => apiRequest("user", "/api/users/profile"),
  updateProfile: (data: Record<string, unknown>) =>
    apiRequest("user", "/api/users/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  getUserById: (id: string) => apiRequest("user", `/api/users/${id}`),
  searchUsers: (query: string) =>
    apiRequest("user", "/api/users/search", { params: { q: query } }),
};

// Team Service API
export const teamApi = {
  getTeams: () => apiRequest("team", "/api/teams"),
  createTeam: (data: { name: string; description?: string }) =>
    apiRequest("team", "/api/teams", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getTeamById: (id: string) => apiRequest("team", `/api/teams/${id}`),
  updateTeam: (id: string, data: { name?: string; description?: string }) =>
    apiRequest("team", `/api/teams/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteTeam: (id: string) =>
    apiRequest("team", `/api/teams/${id}`, { method: "DELETE" }),
  
  // Members
  addMember: (teamId: string, data: { userId: string; role?: string }) =>
    apiRequest("team", `/api/teams/${teamId}/members`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  removeMember: (teamId: string, memberId: string) =>
    apiRequest("team", `/api/teams/${teamId}/members/${memberId}`, {
      method: "DELETE",
    }),
  updateMemberRole: (teamId: string, memberId: string, role: string) =>
    apiRequest("team", `/api/teams/${teamId}/members/${memberId}`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    }),
  
  // Invitations
  getInvitations: (teamId: string) =>
    apiRequest("team", `/api/teams/${teamId}/invitations`),
  sendInvitation: (teamId: string, data: { email: string; role?: string }) =>
    apiRequest("team", `/api/teams/${teamId}/invitations`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  acceptInvitation: (invitationId: string) =>
    apiRequest("team", `/api/teams/invitations/${invitationId}/accept`, {
      method: "POST",
    }),
  declineInvitation: (invitationId: string) =>
    apiRequest("team", `/api/teams/invitations/${invitationId}/decline`, {
      method: "POST",
    }),
};

// Project Service API
export const projectApi = {
  getProjects: () => apiRequest("project", "/api/projects"),
  createProject: (data: {
    name: string;
    description?: string;
    teamId: string;
  }) =>
    apiRequest("project", "/api/projects", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getProjectById: (id: string) =>
    apiRequest("project", `/api/projects/${id}`),
  updateProject: (
    id: string,
    data: { name?: string; description?: string; status?: string }
  ) =>
    apiRequest("project", `/api/projects/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteProject: (id: string) =>
    apiRequest("project", `/api/projects/${id}`, { method: "DELETE" }),
  getProjectTasks: (id: string) =>
    apiRequest("project", `/api/projects/${id}/tasks`),
};

// Chat Service API
export const chatApi = {
  getMessages: (projectId: string, params?: { limit?: number; before?: string }) =>
    apiRequest("chat", `/api/messages/${projectId}`, { params }),
  sendMessage: (data: { projectId: string; content: string }) =>
    apiRequest("chat", "/api/messages", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// Notification Service API
export const notificationApi = {
  getNotifications: () => apiRequest("notification", "/api/notifications"),
  getUnreadCount: () =>
    apiRequest("notification", "/api/notifications/unread"),
  markAsRead: (id: string) =>
    apiRequest("notification", `/api/notifications/${id}/read`, {
      method: "PUT",
    }),
  markAllAsRead: () =>
    apiRequest("notification", "/api/notifications/read-all", {
      method: "PUT",
    }),
  sendNotification: (data: {
    userId: string;
    title: string;
    message: string;
    type?: string;
  }) =>
    apiRequest("notification", "/api/notifications/send", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
