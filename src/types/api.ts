// Shared types for API responses

export interface Team {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  members?: TeamMember[];
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  userId: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  teamId: string;
  team?: { name: string };
  createdAt: string;
}

export interface Message {
  id: string;
  content: string;
  userId: string;
  projectId: string;
  user?: { name: string; imageUrl?: string };
  createdAt: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

export interface User {
  id: string;
  clerkId: string;
  email: string;
  name: string;
  imageUrl?: string;
  createdAt: string;
}
