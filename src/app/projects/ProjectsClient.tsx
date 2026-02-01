"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  teamId: string;
  team?: { name: string };
  createdAt: string;
}

interface Team {
  id: string;
  name: string;
}

interface ProjectsClientProps {
  initialProjects: Project[];
  teams: Team[];
}

export function ProjectsClient({ initialProjects, teams }: ProjectsClientProps) {
  const [projects, setProjects] = useState<Project[]>(
    Array.isArray(initialProjects) ? initialProjects : []
  );
  const [showTeamSelector, setShowTeamSelector] = useState(false);
  const [creatingProject, setCreatingProject] = useState(false);
  const [filterTeamId, setFilterTeamId] = useState<string>("all");
  const router = useRouter();

  const handleCreateProjectClick = () => {
    console.log("Create project clicked, teams available:", teams.length);
    // Check if user has teams
    if (teams.length === 0) {
      console.log("No teams, redirecting to teams page");
      router.push("/teams");
      return;
    }
    // Show team selector modal
    console.log("Showing team selector modal");
    setShowTeamSelector(true);
  };

  const handleTeamSelect = async (teamId: string) => {
    console.log("=== handleTeamSelect START ===");
    console.log("Selected teamId:", teamId);
    setCreatingProject(true);
    try {
      // Create a new project with a default name
      const timestamp = new Date().getTime();
      const projectData = {
        name: `New Project ${timestamp}`,
        description: "",
        teamId: teamId,
        status: "ACTIVE",
      };
      console.log("Creating project with data:", projectData);
      
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(projectData),
      });

      console.log("API Response status:", response.status);
      
      if (response.ok) {
        const newProject = await response.json();
        console.log("Project created successfully:", newProject);
        
        // Close modal first
        setShowTeamSelector(false);
        
        // Navigate to the project page with a flag to open document creator
        const targetUrl = `/projects/${newProject.id}?openDocCreator=true`;
        console.log("Navigating to:", targetUrl);
        router.push(targetUrl);
      } else {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        console.error("Failed to create project:", errorData);
        alert(`Failed to create project: ${errorData.error || "Please try again"}`);
        setCreatingProject(false);
      }
    } catch (error) {
      console.error("Exception in handleTeamSelect:", error);
      alert("Failed to create project. Please check your connection and try again.");
      setCreatingProject(false);
    }
    console.log("=== handleTeamSelect END ===");
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      ACTIVE: "bg-green-100 text-green-800",
      COMPLETED: "bg-blue-100 text-blue-800",
      ON_HOLD: "bg-yellow-100 text-yellow-800",
      CANCELLED: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  // Filter projects by team
  const filteredProjects = filterTeamId === "all" 
    ? projects 
    : projects.filter(p => p.teamId === filterTeamId);

  // Group projects by team for display
  const projectsByTeam = teams.reduce((acc, team) => {
    acc[team.id] = projects.filter(p => p.teamId === team.id);
    return acc;
  }, {} as Record<string, Project[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Projects</h1>
        <div className="flex items-center gap-3">
          {/* Team Filter */}
          <select
            value={filterTeamId}
            onChange={(e) => setFilterTeamId(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Teams</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
          <button
            onClick={handleCreateProjectClick}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={creatingProject}
          >
            {creatingProject ? "Creating..." : "+ Create Project"}
          </button>
        </div>
      </div>

      {/* Team Selection Modal */}
      {showTeamSelector && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9999]"
          onClick={(e) => {
            console.log("Modal backdrop clicked");
            if (e.target === e.currentTarget) {
              setShowTeamSelector(false);
            }
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 border-4 border-blue-500">
            <div className="p-6">
              <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg mb-4">
                <p className="text-sm text-blue-800 dark:text-blue-200 font-bold">
                  🎯 MODAL IS OPEN - Click a team below to create project
                </p>
              </div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Select Team for New Project</h2>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowTeamSelector(false);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
                Choose a team to create your project. You&apos;ll be able to add documents right after.
              </p>
              {creatingProject && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900 rounded-lg flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm text-blue-800 dark:text-blue-200">Creating project...</span>
                </div>
              )}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {teams.map((team) => (
                  <button
                    key={team.id}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log("Team selected:", team.name, team.id);
                      handleTeamSelect(team.id);
                    }}
                    disabled={creatingProject}
                    className="w-full text-left px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="shrink-0">
                          <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">{team.name}</h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Click to create project</p>
                        </div>
                      </div>
                      <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Projects List */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <div className="text-gray-400 mb-4">
            <svg
              className="mx-auto h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {filterTeamId !== "all" ? "No projects in this team" : "No projects yet"}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {filterTeamId !== "all" 
              ? "Create a project for this team to get started" 
              : "Get started by creating your first project"}
          </p>
          {teams.length > 0 && (
            <button
              onClick={handleCreateProjectClick}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              disabled={creatingProject}
            >
              {creatingProject ? "Creating..." : "Create Your First Project"}
            </button>
          )}
        </div>
      ) : filterTeamId === "all" ? (
        // Show grouped by team when "All Teams" is selected
        <div className="space-y-8">
          {teams.map((team) => {
            const teamProjects = projectsByTeam[team.id] || [];
            if (teamProjects.length === 0) return null;
            return (
              <div key={team.id}>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {team.name}
                  <span className="text-sm font-normal text-gray-500">({teamProjects.length} projects)</span>
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {teamProjects.map((project) => (
                    <ProjectCard 
                      key={project.id} 
                      project={project} 
                      getStatusColor={getStatusColor} 
                      onClick={() => router.push(`/projects/${project.id}`)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // Show flat list when a specific team is selected
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <ProjectCard 
              key={project.id} 
              project={project} 
              getStatusColor={getStatusColor} 
              onClick={() => router.push(`/projects/${project.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Extracted ProjectCard component
function ProjectCard({ 
  project, 
  getStatusColor, 
  onClick 
}: { 
  project: Project; 
  getStatusColor: (status: string) => string;
  onClick: () => void;
}) {
  return (
    <div
      className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{project.name}</h3>
        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(project.status)}`}>
          {project.status}
        </span>
      </div>
      {project.description && (
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
          {project.description}
        </p>
      )}
      <div className="space-y-2">
        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
          <svg
            className="h-4 w-4 mr-1"
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
          Team: {project.team?.name || "N/A"}
        </div>
        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
          <svg
            className="h-4 w-4 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          {new Date(project.createdAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}
