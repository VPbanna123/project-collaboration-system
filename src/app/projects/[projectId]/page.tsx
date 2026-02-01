"use client";

import { useUser } from "@clerk/nextjs";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  teamId?: string;
  team?: {
    id: string;
    name: string;
  };
  createdAt: string;
  createdById: string;
}

interface Document {
  id: string;
  title: string;
  content: string;
  projectId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  creator?: {
    name: string | null;
    email: string;
    imageUrl?: string | null;
  };
}

interface DocumentEdit {
  id: string;
  documentId: string;
  userId: string;
  userName: string;
  content: string;
  startPos: number;
  endPos: number;
  action: "INSERT" | "DELETE" | "REPLACE";
  createdAt: string;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "documents">("overview");
  
  // Document creation
  const [showCreateDoc, setShowCreateDoc] = useState(false);
  const [showSidePanel, setShowSidePanel] = useState(false);
  const [teamDocuments, setTeamDocuments] = useState<Array<Document & { projectName: string; projectId: string }>>([]);
  const [loadingTeamDocs, setLoadingTeamDocs] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState("");
  const [newDocContent, setNewDocContent] = useState("");
  
  // Document editor
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editHistory, setEditHistory] = useState<DocumentEdit[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/documents`);
      if (response.ok) {
        const data = await response.json();
        const docs = data || [];
        
        // Fetch creator info for each document
        const docsWithCreators = await Promise.all(
          docs.map(async (doc: Document) => {
            try {
              const userResponse = await fetch(`/api/users/${doc.createdBy}`);
              if (userResponse.ok) {
                const userData = await userResponse.json();
                return {
                  ...doc,
                  creator: {
                    name: userData.name,
                    email: userData.email,
                    imageUrl: userData.imageUrl,
                  },
                };
              }
            } catch (err) {
              console.error(`Failed to fetch creator for doc ${doc.id}:`, err);
            }
            return doc;
          })
        );
        
        setDocuments(docsWithCreators);
      }
    } catch (err) {
      console.error("Failed to fetch documents:", err);
    }
  }, [projectId]);

  useEffect(() => {
    if (!user) return;

    const fetchProject = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch project");
        }
        const data = await response.json();
        
        // Fetch team info if teamId exists
        if (data.teamId) {
          try {
            const teamResponse = await fetch(`/api/teams/${data.teamId}`);
            if (teamResponse.ok) {
              const teamData = await teamResponse.json();
              data.team = { id: teamData.id, name: teamData.name };
            }
          } catch (err) {
            console.error("Failed to fetch team:", err);
          }
        }
        
        setProject(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load project");
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
    fetchDocuments();

    // Check if we should auto-open document creator
    const shouldOpenDocCreator = searchParams.get('openDocCreator');
    if (shouldOpenDocCreator === 'true') {
      setActiveTab('documents');
      setShowSidePanel(true);
      // Clean up the URL
      router.replace(`/projects/${projectId}`);
    }
  }, [projectId, user, fetchDocuments, searchParams, router]);

  // Fetch team documents when side panel opens
  useEffect(() => {
    if (showSidePanel && project?.teamId) {
      const fetchTeamDocuments = async () => {
        setLoadingTeamDocs(true);
        try {
          const response = await fetch(`/api/teams/${project.teamId}/documents`);
          if (response.ok) {
            const result = await response.json();
            const documents = result.data || [];
            // Filter out documents from current project
            setTeamDocuments(documents.filter((doc: Document & { projectName: string; projectId: string }) => doc.projectId !== projectId));
          }
        } catch (err) {
          console.error('Failed to fetch team documents:', err);
        } finally {
          setLoadingTeamDocs(false);
        }
      };
      fetchTeamDocuments();
    }
  }, [showSidePanel, project?.teamId, projectId]);

  const handleCreateDocument = async () => {
    if (!newDocTitle.trim()) {
      toast.error("Please enter a document title");
      return;
    }

    setCreating(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newDocTitle,
          content: newDocContent,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create document");
      }

      const newDoc = await response.json();
      
      // Fetch creator info for the new document
      try {
        const userResponse = await fetch(`/api/users/${newDoc.createdBy}`);
        if (userResponse.ok) {
          const userData = await userResponse.json();
          newDoc.creator = {
            name: userData.name,
            email: userData.email,
            imageUrl: userData.imageUrl,
          };
        }
      } catch (err) {
        console.error("Failed to fetch creator info:", err);
      }
      
      setDocuments([...documents, newDoc]);
      setNewDocTitle("");
      setNewDocContent("");
      setShowCreateDoc(false);
      toast.success("Document created successfully!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create document");
    } finally {
      setCreating(false);
    }
  };

  const handleSelectDocument = async (doc: Document) => {
    setSelectedDoc(doc);
    setEditContent(doc.content);
    setShowHistory(false);
    
    // Fetch edit history
    try {
      const response = await fetch(`/api/documents/${doc.id}/edits`);
      if (response.ok) {
        const data = await response.json();
        setEditHistory(data || []);
      }
    } catch (err) {
      console.error("Failed to fetch edit history:", err);
    }
  };

  const handleSaveDocument = async () => {
    if (!selectedDoc) return;
    
    // Check if user is the creator
    if (selectedDoc.createdBy !== user?.id) {
      toast.error("Only the document creator can edit this document");
      return;
    }
    
    setSaving(true);
    try {
      const response = await fetch(`/api/documents/${selectedDoc.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: editContent,
          userName: user?.fullName || user?.emailAddresses?.[0]?.emailAddress || "Unknown",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save document");
      }

      const updated = await response.json();
      setSelectedDoc(updated.document || updated);
      setDocuments(documents.map(d => d.id === selectedDoc.id ? (updated.document || updated) : d));
      
      // Refresh edit history
      const historyResponse = await fetch(`/api/documents/${selectedDoc.id}/edits`);
      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        setEditHistory(historyData || []);
      }
      
      toast.success("Document saved successfully!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save document");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    const doc = documents.find(d => d.id === docId);
    if (doc && doc.createdBy !== user?.id) {
      toast.error("Only the document creator can delete this document");
      return;
    }
    
    if (!confirm("Are you sure you want to delete this document?")) return;

    setDeleting(docId);
    try {
      const response = await fetch(`/api/documents/${docId}`, {
        method: "DELETE",
      });

      if (!response.ok && response.status !== 204) {
        const error = await response.json().catch(() => ({ error: "Failed to delete document" }));
        throw new Error(error.error || "Failed to delete document");
      }

      setDocuments(documents.filter(d => d.id !== docId));
      if (selectedDoc?.id === docId) {
        setSelectedDoc(null);
        setEditContent("");
      }
      toast.success("Document deleted successfully!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete document");
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Project Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error || "This project doesn't exist"}</p>
          <button
            onClick={() => router.push("/projects")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/projects")}
            className="text-blue-600 dark:text-blue-400 hover:underline mb-4"
          >
            ← Back to Projects
          </button>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{project.name}</h1>
                {project.description && (
                  <p className="text-gray-600 dark:text-gray-400 mb-3">{project.description}</p>
                )}
                <div className="flex items-center gap-4 text-sm">
                  <span className={`px-3 py-1 rounded-full font-medium ${
                    project.status === "COMPLETED" ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200" :
                    project.status === "IN_PROGRESS" ? "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200" :
                    project.status === "ON_HOLD" ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200" :
                    "bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200"
                  }`}>
                    {(project.status || "ACTIVE").replace("_", " ")}
                  </span>
                  {project.team && (
                    <span className="text-gray-500 dark:text-gray-400">
                      Team: <span className="text-gray-900 dark:text-white">{project.team.name}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-6 py-3 font-medium text-sm ${
              activeTab === "overview"
                ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("documents")}
            className={`px-6 py-3 font-medium text-sm ${
              activeTab === "documents"
                ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            Documents ({documents.length})
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Project Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Created</p>
                <p className="text-gray-900 dark:text-white">{new Date(project.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                <p className="text-gray-900 dark:text-white">{(project.status || "ACTIVE").replace("_", " ")}</p>
              </div>
              {project.team && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Team</p>
                  <button
                    onClick={() => router.push(`/teams/${project.teamId}`)}
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {project.team.name}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Side Panel for Team Documents */}
        {showSidePanel && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-end z-50">
            <div className="bg-white dark:bg-gray-800 w-full max-w-2xl h-full overflow-y-auto shadow-2xl">
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 z-10">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Create Your First Document</h2>
                  <button
                    onClick={() => setShowSidePanel(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Choose to reference previous work from your team or start fresh
                </p>
              </div>

              <div className="p-6 space-y-6">
                {/* New Document Option */}
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 hover:border-blue-500 dark:hover:border-blue-500 transition-colors">
                  <button
                    onClick={() => {
                      setShowSidePanel(false);
                      setNewDocTitle("New Document");
                      setShowCreateDoc(true);
                    }}
                    className="w-full text-left"
                  >
                    <div className="flex items-start gap-4">
                      <div className="shrink-0 p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                        <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Start with New Page</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Begin with a fresh blank document and create something new
                        </p>
                      </div>
                    </div>
                  </button>
                </div>

                {/* Previous Work from Team */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Previous Work from Team
                  </h3>

                  {loadingTeamDocs ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : teamDocuments.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        No previous documents from your team yet
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {teamDocuments.map((doc) => (
                        <div
                          key={doc.id}
                          className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow bg-gray-50 dark:bg-gray-700"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 dark:text-white">{doc.title}</h4>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                From: <span className="font-medium">{doc.projectName}</span>
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Updated: {new Date(doc.updatedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          {doc.content && (
                            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-3">
                              {doc.content}
                            </p>
                          )}
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setNewDocTitle(doc.title);
                                setNewDocContent(doc.content || "");
                                setShowSidePanel(false);
                                setShowCreateDoc(true);
                              }}
                              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                              Use as Template
                            </button>
                            <button
                              onClick={() => {
                                setNewDocTitle(`Reference: ${doc.title}`);
                                setNewDocContent(`Referenced from "${doc.title}" (${doc.projectName}):\n\n---\n\n`);
                                setShowSidePanel(false);
                                setShowCreateDoc(true);
                              }}
                              className="px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500"
                            >
                              Reference
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Documents Tab */}
        {activeTab === "documents" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Document List */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">Documents</h3>
                <button
                  onClick={() => setShowCreateDoc(!showCreateDoc)}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  + New
                </button>
              </div>

              {showCreateDoc && (
                <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <input
                    type="text"
                    value={newDocTitle}
                    onChange={(e) => setNewDocTitle(e.target.value)}
                    placeholder="Document title"
                    className="w-full px-3 py-2 mb-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  />
                  <textarea
                    value={newDocContent}
                    onChange={(e) => setNewDocContent(e.target.value)}
                    placeholder="Initial content (optional)"
                    rows={3}
                    className="w-full px-3 py-2 mb-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleCreateDocument}
                      disabled={creating}
                      className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {creating ? "Creating..." : "Create"}
                    </button>
                    <button
                      onClick={() => setShowCreateDoc(false)}
                      disabled={creating}
                      className="px-3 py-1 text-sm bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white rounded-lg disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {documents.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
                    No documents yet
                  </p>
                ) : (
                  documents.map((doc) => (
                    <div
                      key={doc.id}
                      onClick={() => handleSelectDocument(doc)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedDoc?.id === doc.id
                          ? "bg-blue-100 dark:bg-blue-900 border border-blue-500"
                          : "bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                            {doc.title}
                          </h4>
                          {doc.creator && (
                            <div className="flex items-center gap-1.5 mt-1">
                              {doc.creator.imageUrl ? (
                                <img 
                                  src={doc.creator.imageUrl} 
                                  alt={doc.creator.name || doc.creator.email}
                                  className="w-4 h-4 rounded-full"
                                />
                              ) : (
                                <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-white text-[10px] font-semibold">
                                  {(doc.creator.name || doc.creator.email).charAt(0).toUpperCase()}
                                </div>
                              )}
                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                {doc.creator.name || doc.creator.email}
                              </span>
                              {doc.createdBy === user?.id && (
                                <span className="text-xs text-blue-600 dark:text-blue-400">• You</span>
                              )}
                            </div>
                          )}
                        </div>
                        {doc.createdBy === user?.id && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteDocument(doc.id);
                            }}
                            disabled={deleting === doc.id}
                            className="text-red-500 hover:text-red-700 text-xs disabled:opacity-50 ml-2"
                          >
                            {deleting === doc.id ? "..." : "×"}
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Updated: {new Date(doc.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Document Editor */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              {selectedDoc ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{selectedDoc.title}</h3>
                      {selectedDoc.creator && (
                        <div className="flex items-center gap-2 mt-1">
                          {selectedDoc.creator.imageUrl ? (
                            <img 
                              src={selectedDoc.creator.imageUrl} 
                              alt={selectedDoc.creator.name || selectedDoc.creator.email}
                              className="w-5 h-5 rounded-full"
                            />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-semibold">
                              {(selectedDoc.creator.name || selectedDoc.creator.email).charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Created by {selectedDoc.creator.name || selectedDoc.creator.email}
                            {selectedDoc.createdBy === user?.id && <span className="text-blue-600 dark:text-blue-400"> (You)</span>}
                          </span>
                        </div>
                      )}
                      {selectedDoc.createdBy !== user?.id && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                          🔒 Read-only: Only the creator can edit this document
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowHistory(!showHistory)}
                        className={`px-3 py-1 text-sm rounded-lg ${
                          showHistory
                            ? "bg-purple-600 text-white"
                            : "bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white"
                        }`}
                      >
                        History
                      </button>
                      {selectedDoc.createdBy === user?.id && (
                        <button
                          onClick={handleSaveDocument}
                          disabled={saving}
                          className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {saving ? "Saving..." : "Save"}
                        </button>
                      )}
                    </div>
                  </div>

                  {showHistory ? (
                    <div className="h-[400px] overflow-y-auto">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">Edit History</h4>
                      {editHistory.length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-400 text-sm">No edit history yet</p>
                      ) : (
                        <div className="space-y-3">
                          {editHistory.map((edit) => (
                            <div
                              key={edit.id}
                              className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {edit.userName}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-xs ${
                                  edit.action === "INSERT" ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200" :
                                  edit.action === "DELETE" ? "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200" :
                                  "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200"
                                }`}>
                                  {edit.action}
                                </span>
                              </div>
                              <p className="text-gray-600 dark:text-gray-400 text-xs mb-1">
                                Position: {edit.startPos} - {edit.endPos}
                              </p>
                              <p className="text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 p-2 rounded text-xs font-mono truncate">
                                {edit.content || "(empty)"}
                              </p>
                              <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                                {new Date(edit.createdAt).toLocaleString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      disabled={selectedDoc.createdBy !== user?.id}
                      className="w-full h-[400px] px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm resize-none disabled:opacity-60 disabled:cursor-not-allowed"
                      placeholder={selectedDoc.createdBy !== user?.id ? "This document is read-only" : "Start writing..."}
                    />
                  )}
                </>
              ) : (
                <div className="h-[400px] flex items-center justify-center text-gray-500 dark:text-gray-400">
                  Select a document to view or edit
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
