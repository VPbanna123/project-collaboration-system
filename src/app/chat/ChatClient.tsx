"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";

interface User {
  id: string;
  clerkId: string;
  name: string;
  email: string;
  imageUrl?: string;
}

interface Team {
  id: string;
  name: string;
  description?: string;
  members: TeamMember[];
}

interface TeamMember {
  id: string;
  userId: string;
  role: string;
  user?: User;
}

interface Conversation {
  id: string;
  participant1Id: string;
  participant2Id: string;
  participant1?: User;
  participant2?: User;
  lastMessage?: DirectMessage;
  _count?: { messages: number };
  unreadCount?: number;
  updatedAt: string;
}

interface DirectMessage {
  id: string;
  content: string;
  senderId: string;
  conversationId: string;
  read: boolean;
  createdAt: string;
  sender?: User;
}

interface Project {
  id: string;
  name: string;
}

interface Message {
  id: string;
  content: string;
  userId: string;
  projectId: string;
  user?: { name: string; imageUrl?: string };
  createdAt: string;
}

interface Document {
  id: string;
  title: string;
  content: string;
  projectId: string;
  projectName?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

type ChatMode = "direct" | "project" | "team";

interface ChatClientProps {
  initialMessages: Message[];
  projects: Project[];
  currentUserId: string;
}

export function ChatClient({ initialMessages, projects, currentUserId }: ChatClientProps) {
  const router = useRouter();
  const safeProjects = Array.isArray(projects) ? projects : [];
  
  // Socket state
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // Chat mode state
  const [chatMode, setChatMode] = useState<ChatMode>("direct");
  
  // Direct message state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [directMessages, setDirectMessages] = useState<DirectMessage[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  
  // Teams state
  const [teams, setTeams] = useState<Team[]>([]);
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  
  // User search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  // Project chat state (existing)
  const [messages, setMessages] = useState<Message[]>(
    Array.isArray(initialMessages) ? initialMessages : []
  );
  const [selectedProjectId, setSelectedProjectId] = useState(safeProjects[0]?.id || "");
  
  // Message input state
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  
  // Typing indicators
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map());
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Online users
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  
  // Document sharing state
  const [showDocumentPicker, setShowDocumentPicker] = useState(false);
  const [teamDocuments, setTeamDocuments] = useState<Document[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Initialize Socket.IO connection
  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_CHAT_SERVICE_URL || "http://localhost:3004";
    
    const newSocket = io(socketUrl, {
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on("connect", () => {
      console.log("Socket connected:", newSocket.id);
      setIsConnected(true);
      
      // Register user as online
      newSocket.emit("user:online", currentUserId);
    });

    newSocket.on("disconnect", () => {
      console.log("Socket disconnected");
      setIsConnected(false);
    });

    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      setIsConnected(false);
    });

    // Handle incoming direct messages
    newSocket.on("dm:new", (data: { message: DirectMessage }) => {
      console.log("Received new DM:", data);
      if (selectedConversation?.id === data.message.conversationId) {
        setDirectMessages((prev) => [...prev, data.message]);
        scrollToBottom();
        // Mark as read
        markConversationAsRead(data.message.conversationId);
      }
      // Update conversation list
      loadConversations();
    });

    // Handle DM notifications for messages in other conversations
    newSocket.on("dm:notification", (data: { message: DirectMessage, conversation: Conversation }) => {
      toast.info(`New message from ${data.message.sender?.name || "Someone"}`);
      loadConversations();
    });

    // Handle typing indicators
    newSocket.on("dm:typing", (data: { conversationId: string; userId: string; userName: string; isTyping: boolean }) => {
      if (data.isTyping) {
        setTypingUsers((prev) => new Map(prev).set(data.conversationId, data.userName));
      } else {
        setTypingUsers((prev) => {
          const newMap = new Map(prev);
          newMap.delete(data.conversationId);
          return newMap;
        });
      }
    });

    // Handle online status updates
    newSocket.on("user:status", (data: { clerkId: string; online: boolean }) => {
      setOnlineUsers((prev) => {
        const newSet = new Set(prev);
        if (data.online) {
          newSet.add(data.clerkId);
        } else {
          newSet.delete(data.clerkId);
        }
        return newSet;
      });
    });

    // Handle users online check response
    newSocket.on("users:online:status", (data: { onlineUsers: string[] }) => {
      setOnlineUsers(new Set(data.onlineUsers));
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [currentUserId, scrollToBottom]);

  // Join conversation room when selected
  useEffect(() => {
    if (socket && isConnected && selectedConversation) {
      socket.emit("join:conversation", { conversationId: selectedConversation.id });
    }
  }, [socket, isConnected, selectedConversation]);

  // Load conversations
  const loadConversations = useCallback(async () => {
    setLoadingConversations(true);
    try {
      const response = await fetch("/api/chat/conversations");
      if (response.ok) {
        const data = await response.json();
        setConversations(data.data || []);
      }
    } catch (error) {
      console.error("Failed to load conversations:", error);
      toast.error("Failed to load conversations");
    } finally {
      setLoadingConversations(false);
    }
  }, []);

  // Load teams
  const loadTeams = useCallback(async () => {
    setLoadingTeams(true);
    try {
      const response = await fetch("/api/teams");
      if (response.ok) {
        const data = await response.json();
        setTeams(data.data || []);
      }
    } catch (error) {
      console.error("Failed to load teams:", error);
      toast.error("Failed to load teams");
    } finally {
      setLoadingTeams(false);
    }
  }, []);

  // Initial data load
  useEffect(() => {
    loadConversations();
    loadTeams();
  }, [loadConversations, loadTeams]);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [directMessages, messages, scrollToBottom]);

  // Load messages for a conversation
  const loadDirectMessages = async (conversationId: string) => {
    setLoadingMessages(true);
    try {
      const response = await fetch(`/api/chat/conversations/${conversationId}/messages`);
      if (response.ok) {
        const data = await response.json();
        // The API returns { messages: [...], hasMore, nextCursor }
        setDirectMessages(data.data?.messages || []);
        scrollToBottom();
      }
    } catch (error) {
      console.error("Failed to load messages:", error);
      toast.error("Failed to load messages");
    } finally {
      setLoadingMessages(false);
    }
  };

  // Mark conversation as read
  const markConversationAsRead = async (conversationId: string) => {
    try {
      await fetch(`/api/chat/conversations/${conversationId}/read`, {
        method: "POST",
      });
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  // Load documents from ALL user's teams (for direct chat)
  const loadAllTeamDocuments = async () => {
    setLoadingDocuments(true);
    try {
      const allDocuments: Document[] = [];
      for (const team of teams) {
        const response = await fetch(`/api/teams/${team.id}/documents`);
        if (response.ok) {
          const data = await response.json();
          const docs = data.data || [];
          // Add team name to each document for clarity
          docs.forEach((doc: Document) => {
            doc.projectName = doc.projectName ? `${team.name} - ${doc.projectName}` : team.name;
          });
          allDocuments.push(...docs);
        }
      }

      setTeamDocuments(allDocuments);
    } catch (error) {
      console.error("Failed to load documents:", error);
      toast.error("Failed to load documents");
    } finally {
      setLoadingDocuments(false);
    }
  };

  // Load documents from specific team only (for team chat)
  const loadTeamDocuments = async (teamId: string) => {
    setLoadingDocuments(true);
    try {
      const response = await fetch(`/api/teams/${teamId}/documents`);
      if (response.ok) {
        const data = await response.json();
        const docs = data.data || [];
        const team = teams.find(t => t.id === teamId);
        // Add team name to each document for clarity
        docs.forEach((doc: Document) => {
          doc.projectName = doc.projectName ? `${team?.name} - ${doc.projectName}` : team?.name || 'Unknown';
        });
        setTeamDocuments(docs);
      }
    } catch (error) {
      console.error("Failed to load documents:", error);
      toast.error("Failed to load documents");
    } finally {
      setLoadingDocuments(false);
    }
  };

  // Share document in chat
  const shareDocument = async (documentId: string, documentTitle: string) => {
    if (!selectedConversation) return;
    
    setIsSending(true);
    try {
      const response = await fetch(`/api/chat/conversations/${selectedConversation.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: `📄 Shared document: ${documentTitle}`,
          documentId: documentId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setDirectMessages((prev) => [...prev, data.data]);
        setShowDocumentPicker(false);
        scrollToBottom();
        toast.success("Document shared!");
      }
    } catch (error) {
      console.error("Failed to share document:", error);
      toast.error("Failed to share document");
    } finally {
      setIsSending(false);
    }
  };

  // Start a conversation with a user
  const startConversation = async (otherUser: User) => {
    try {
      const response = await fetch("/api/chat/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otherUserId: otherUser.id }),
      });

      if (response.ok) {
        const data = await response.json();
        const conversation = data.data;
        setSelectedConversation(conversation);
        await loadDirectMessages(conversation.id);
        markConversationAsRead(conversation.id);
        loadConversations();
        setShowSearchResults(false);
        setSearchQuery("");
        setChatMode("direct");
      } else {
        toast.error("Failed to start conversation");
      }
    } catch (error) {
      console.error("Failed to start conversation:", error);
      toast.error("Failed to start conversation");
    }
  };

  // Search users
  const searchUsers = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await fetch(`/api/chat/users/search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.data || []);
      }
    } catch (error) {
      console.error("Failed to search users:", error);
    } finally {
      setSearching(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        searchUsers(searchQuery);
        setShowSearchResults(true);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchUsers]);

  // Send direct message
  const sendDirectMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    setIsSending(true);
    try {
      // Emit via socket for real-time
      if (socket && isConnected) {
        socket.emit("dm:send", {
          conversationId: selectedConversation.id,
          senderId: currentUserId,
          content: newMessage.trim(),
        });
      }

      // Also send via API as backup
      const response = await fetch(`/api/chat/conversations/${selectedConversation.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        // Only add if not already added by socket
        setDirectMessages((prev) => {
          if (!prev.find((m) => m.id === data.data.id)) {
            return [...prev, data.data];
          }
          return prev;
        });
        setNewMessage("");
        scrollToBottom();
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  // Handle typing indicator
  const handleTyping = () => {
    if (socket && isConnected && selectedConversation) {
      socket.emit("dm:typing", {
        conversationId: selectedConversation.id,
        userId: currentUserId,
        userName: "You",
        isTyping: true,
      });

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("dm:typing", {
          conversationId: selectedConversation.id,
          userId: currentUserId,
          userName: "You",
          isTyping: false,
        });
      }, 2000);
    }
  };

  // Project chat functions (existing)
  const loadProjectMessages = async (projectId: string) => {
    try {
      const response = await fetch(`/api/messages/${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error("Failed to load messages:", error);
    }
  };

  const sendProjectMessage = async () => {
    if (!newMessage.trim() || !selectedProjectId) return;

    setIsSending(true);
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: selectedProjectId,
          content: newMessage,
        }),
      });

      if (response.ok) {
        const message = await response.json();
        setMessages([...messages, message]);
        setNewMessage("");
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    if (chatMode === "project" && selectedProjectId) {
      loadProjectMessages(selectedProjectId);
    }
  }, [chatMode, selectedProjectId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatMode === "direct") {
      sendDirectMessage();
    } else {
      sendProjectMessage();
    }
  };

  const toggleTeam = (teamId: string) => {
    setExpandedTeams((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(teamId)) {
        newSet.delete(teamId);
      } else {
        newSet.add(teamId);
      }
      return newSet;
    });
  };

  const getOtherUser = (conversation: Conversation) => {
    if (conversation.participant1?.clerkId === currentUserId) {
      return conversation.participant2;
    }
    return conversation.participant1;
  };

  const selectedProject = safeProjects.find((p) => p.id === selectedProjectId);
  const isUserOnline = (clerkId: string) => onlineUsers.has(clerkId);

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Search Bar */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users by name or email..."
              className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <svg
              className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {/* Search Results Dropdown */}
          {showSearchResults && searchQuery && (
            <div className="absolute z-10 mt-2 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto">
              {searching ? (
                <div className="p-4 text-center text-gray-500">Searching...</div>
              ) : searchResults.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No users found</div>
              ) : (
                searchResults.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => startConversation(user)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="relative">
                      {user.imageUrl ? (
                        <img
                          src={user.imageUrl}
                          alt={user.name}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                          {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                        </div>
                      )}
                      {isUserOnline(user.clerkId) && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {user.name || "Unknown"}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Chat Mode Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setChatMode("direct")}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              chatMode === "direct"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            Direct Messages
          </button>
          <button
            onClick={() => setChatMode("team")}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              chatMode === "team"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            Teams
          </button>
          <button
            onClick={() => setChatMode("project")}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              chatMode === "project"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            Projects
          </button>
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto">
          {chatMode === "team" ? (
            /* Team List for Group Chat */
            <div className="p-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Team Chats
              </h3>
              {loadingTeams ? (
                <div className="text-center py-4 text-gray-500">Loading...</div>
              ) : teams.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-sm">No teams yet</p>
                  <button
                    onClick={() => router.push("/teams")}
                    className="text-blue-600 text-sm mt-2 hover:underline"
                  >
                    Create or join a team
                  </button>
                </div>
              ) : (
                teams.map((team) => (
                  <button
                    key={team.id}
                    onClick={() => setSelectedTeam(team)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors mb-2 ${
                      selectedTeam?.id === team.id
                        ? "bg-blue-100 dark:bg-blue-900/50"
                        : "hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    <div className="w-12 h-12 rounded-lg bg-indigo-500 flex items-center justify-center text-white font-semibold">
                      {team.name[0].toUpperCase()}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-gray-900 dark:text-white truncate">
                        {team.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {team.members?.length || 0} members
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          ) : chatMode === "direct" ? (
            <>
              {/* Teams & Members Section */}
              <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Teams & Members
                </h3>
                {loadingTeams ? (
                  <div className="text-center py-4 text-gray-500">Loading...</div>
                ) : teams.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-gray-500 text-sm">No teams yet</p>
                    <button
                      onClick={() => router.push("/teams")}
                      className="text-blue-600 text-sm mt-1 hover:underline"
                    >
                      Create or join a team
                    </button>
                  </div>
                ) : (
                  teams.map((team) => (
                    <div key={team.id} className="mb-2">
                      <button
                        onClick={() => toggleTeam(team.id)}
                        className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <svg
                          className={`w-4 h-4 text-gray-400 transition-transform ${
                            expandedTeams.has(team.id) ? "rotate-90" : ""
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                        <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white text-sm font-semibold">
                          {team.name[0].toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white truncate">
                          {team.name}
                        </span>
                        <span className="text-xs text-gray-500 ml-auto">
                          {team.members?.length || 0}
                        </span>
                      </button>

                      {/* Team Members */}
                      {expandedTeams.has(team.id) && (
                        <div className="ml-6 mt-1 space-y-1">
                          {team.members?.map((member) => {
                            if (member.user?.clerkId === currentUserId) return null;
                            return (
                              <button
                                key={member.id}
                                onClick={() => member.user && startConversation(member.user)}
                                className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                              >
                                <div className="relative">
                                  {member.user?.imageUrl ? (
                                    <img
                                      src={member.user.imageUrl}
                                      alt={member.user.name}
                                      className="w-8 h-8 rounded-full"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white text-sm font-semibold">
                                      {member.user?.name?.[0]?.toUpperCase() || "?"}
                                    </div>
                                  )}
                                  {member.user && isUserOnline(member.user.clerkId) && (
                                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                                  )}
                                </div>
                                <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                                  {member.user?.name || "Unknown"}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Recent Conversations */}
              <div className="p-3">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Recent Conversations
                </h3>
                {loadingConversations ? (
                  <div className="text-center py-4 text-gray-500">Loading...</div>
                ) : conversations.length === 0 ? (
                  <div className="text-center py-8">
                    <svg
                      className="mx-auto h-10 w-10 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                    <p className="text-gray-500 text-sm mt-2">No conversations yet</p>
                    <p className="text-gray-400 text-xs mt-1">
                      Search for users or select team members to start chatting
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {conversations.map((conversation) => {
                      const otherUser = getOtherUser(conversation);
                      const isSelected = selectedConversation?.id === conversation.id;
                      const hasUnread = (conversation.unreadCount || 0) > 0;

                      return (
                        <button
                          key={conversation.id}
                          onClick={() => {
                            setSelectedConversation(conversation);
                            loadDirectMessages(conversation.id);
                            markConversationAsRead(conversation.id);
                          }}
                          className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                            isSelected
                              ? "bg-blue-100 dark:bg-blue-900/50"
                              : "hover:bg-gray-100 dark:hover:bg-gray-700"
                          }`}
                        >
                          <div className="relative">
                            {otherUser?.imageUrl ? (
                              <img
                                src={otherUser.imageUrl}
                                alt={otherUser.name}
                                className="w-12 h-12 rounded-full"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gray-400 flex items-center justify-center text-white font-semibold">
                                {otherUser?.name?.[0]?.toUpperCase() || "?"}
                              </div>
                            )}
                            {otherUser && isUserOnline(otherUser.clerkId) && (
                              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                            )}
                          </div>
                          <div className="flex-1 text-left min-w-0">
                            <div className="flex items-center justify-between">
                              <span
                                className={`font-medium truncate ${
                                  hasUnread
                                    ? "text-gray-900 dark:text-white"
                                    : "text-gray-700 dark:text-gray-300"
                                }`}
                              >
                                {otherUser?.name || "Unknown"}
                              </span>
                              {conversation.lastMessage && (
                                <span className="text-xs text-gray-500">
                                  {new Date(conversation.lastMessage.createdAt).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center justify-between">
                              <p
                                className={`text-sm truncate ${
                                  hasUnread
                                    ? "text-gray-900 dark:text-white font-medium"
                                    : "text-gray-500"
                                }`}
                              >
                                {conversation.lastMessage?.content || "No messages yet"}
                              </p>
                              {hasUnread && (
                                <span className="ml-2 bg-blue-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                  {conversation.unreadCount}
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Project List */
            <div className="p-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Projects
              </h3>
              {safeProjects.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-sm">No projects available</p>
                  <button
                    onClick={() => router.push("/projects")}
                    className="text-blue-600 text-sm mt-2 hover:underline"
                  >
                    Create a project
                  </button>
                </div>
              ) : (
                safeProjects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => setSelectedProjectId(project.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      selectedProjectId === project.id
                        ? "bg-blue-100 dark:bg-blue-900/50"
                        : "hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center text-white font-semibold">
                      {project.name[0].toUpperCase()}
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white truncate">
                      {project.name}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Connection Status */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected ? "bg-green-500" : "bg-red-500"
              }`}
            ></div>
            {isConnected ? "Connected" : "Disconnected"}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900">
        {chatMode === "team" ? (
          <>
            {/* Team Chat Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
              {selectedTeam ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-500 flex items-center justify-center text-white font-semibold">
                    {selectedTeam.name[0].toUpperCase()}
                  </div>
                  <div>
                    <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {selectedTeam.name}
                    </h1>
                    <p className="text-sm text-gray-500">
                      {selectedTeam.members?.length || 0} members
                    </p>
                  </div>
                </div>
              ) : (
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Select a team
                </h1>
              )}
            </div>

            {/* Team Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {!selectedTeam ? (
                <div className="text-center py-12">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
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
                  <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                    Team Chat
                  </h3>
                  <p className="text-gray-500 mt-2">
                    Select a team to start group chat
                  </p>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">Team group chat coming soon! 🚀</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Real-time team messaging will be available here
                  </p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </>
        ) : chatMode === "direct" ? (
          <>
            {/* DM Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
              {selectedConversation ? (
                <div className="flex items-center gap-3">
                  <div className="relative">
                    {getOtherUser(selectedConversation)?.imageUrl ? (
                      <img
                        src={getOtherUser(selectedConversation)?.imageUrl}
                        alt={getOtherUser(selectedConversation)?.name || ""}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-400 flex items-center justify-center text-white font-semibold">
                        {getOtherUser(selectedConversation)?.name?.[0]?.toUpperCase() || "?"}
                      </div>
                    )}
                    {getOtherUser(selectedConversation) &&
                      isUserOnline(getOtherUser(selectedConversation)!.clerkId) && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                      )}
                  </div>
                  <div>
                    <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {getOtherUser(selectedConversation)?.name || "Unknown"}
                    </h1>
                    <p className="text-sm text-gray-500">
                      {getOtherUser(selectedConversation) &&
                      isUserOnline(getOtherUser(selectedConversation)!.clerkId)
                        ? "Online"
                        : "Offline"}
                    </p>
                  </div>
                </div>
              ) : (
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Select a conversation
                </h1>
              )}
            </div>

            {/* DM Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {!selectedConversation ? (
                <div className="text-center py-12">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                    Welcome to Chat
                  </h3>
                  <p className="text-gray-500 mt-2">
                    Search for users or select a team member to start messaging
                  </p>
                </div>
              ) : loadingMessages ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Loading messages...</p>
                </div>
              ) : directMessages.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No messages yet. Say hello! 👋</p>
                </div>
              ) : (
                directMessages.map((message) => {
                  const isCurrentUser = message.senderId === currentUserId;
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`max-w-xs lg:max-w-md xl:max-w-lg`}>
                        <div
                          className={`rounded-2xl px-4 py-2 ${
                            isCurrentUser
                              ? "bg-blue-600 text-white"
                              : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700"
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                        </div>
                        <div
                          className={`text-xs mt-1 ${
                            isCurrentUser ? "text-right" : "text-left"
                          } text-gray-500`}
                        >
                          {new Date(message.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {isCurrentUser && (
                            <span className="ml-1">{message.read ? "✓✓" : "✓"}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Typing Indicator */}
              {selectedConversation && typingUsers.has(selectedConversation.id) && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-2">
                    <div className="flex gap-1">
                      <div
                        className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </>
        ) : (
          <>
            {/* Project Chat Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                {selectedProject ? `# ${selectedProject.name}` : "Select a project"}
              </h1>
            </div>

            {/* Project Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {!selectedProjectId ? (
                <div className="text-center py-12">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                    Project Chat
                  </h3>
                  <p className="text-gray-500 mt-2">Select a project to view chat</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((message) => {
                  const isCurrentUser = message.userId === currentUserId;
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`max-w-xs lg:max-w-md xl:max-w-lg`}>
                        <div
                          className={`rounded-2xl px-4 py-2 ${
                            isCurrentUser
                              ? "bg-blue-600 text-white"
                              : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700"
                          }`}
                        >
                          {!isCurrentUser && (
                            <div className="text-xs font-medium mb-1 opacity-75">
                              {message.user?.name || "Unknown"}
                            </div>
                          )}
                          <p className="text-sm">{message.content}</p>
                        </div>
                        <div
                          className={`text-xs mt-1 ${
                            isCurrentUser ? "text-right" : "text-left"
                          } text-gray-500`}
                        >
                          {new Date(message.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
          </>
        )}

        {/* Message Input */}
        {((chatMode === "direct" && selectedConversation) ||
          (chatMode === "team" && selectedTeam) ||
          (chatMode === "project" && selectedProjectId)) && (
          <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
            <form onSubmit={handleSubmit} className="flex gap-2">
              {/* Document Share Button */}
              {((chatMode === "direct" && selectedConversation) || (chatMode === "team" && selectedTeam)) && (
                <button
                  type="button"
                  onClick={() => {
                    setShowDocumentPicker(true);
                    if (chatMode === "team" && selectedTeam) {
                      // Team chat: Load only this team's documents
                      loadTeamDocuments(selectedTeam.id);
                    } else if (chatMode === "direct") {
                      // Direct chat: Load all user's team documents
                      loadAllTeamDocuments();
                    }
                  }}
                  className="px-3 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title="Share Document"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </button>
              )}
              
              <input
                type="text"
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  if (chatMode === "direct") handleTyping();
                }}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isSending}
              />
              <button
                type="submit"
                disabled={isSending || !newMessage.trim()}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isSending || !newMessage.trim()
                    ? "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                {isSending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Sending
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                      />
                    </svg>
                    Send
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Document Picker Modal */}
      {showDocumentPicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Share Document
              </h2>
              <button
                onClick={() => setShowDocumentPicker(false)}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {loadingDocuments ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : teamDocuments.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="mt-4 text-gray-500 dark:text-gray-400">
                    No shared documents available
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                    {selectedConversation && getOtherUser(selectedConversation) 
                      ? `You and ${getOtherUser(selectedConversation)?.name} don't have shared team documents yet`
                      : 'Create documents in shared team projects to share them here'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {teamDocuments.map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => shareDocument(doc.id, doc.title)}
                      className="w-full text-left p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <svg className="w-8 h-8 text-blue-500 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 dark:text-white truncate">
                            {doc.title}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Project: {doc.projectName || 'Unknown'}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            Updated {new Date(doc.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <svg className="w-5 h-5 text-gray-400 flex-shrink-0 mt-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <button
                onClick={() => setShowDocumentPicker(false)}
                className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
