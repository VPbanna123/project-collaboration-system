import { projectApi, teamApi } from "@/lib/api-client";
import { ProjectsClient } from "./ProjectsClient";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { MainNav } from "@/components/MainNav";
import type { Project, Team } from "@/types/api";

export default async function ProjectsPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/login");
  }

  let projects: Project[] = [];
  let teams: Team[] = [];
  
  try {
    const results = await Promise.all([
      projectApi.getProjects().catch((err) => {
        console.error("Error fetching projects:", err);
        return [];
      }),
      teamApi.getTeams().catch((err) => {
        console.error("Error fetching teams:", err);
        return [];
      }),
    ]);
    
    console.log("Raw results from API:", results);
    
    // Handle different response formats
    const projectsData = results[0];
    const teamsData = results[1];
    
    // Projects might be wrapped in { data: [...] } or direct array
    projects = Array.isArray(projectsData) 
      ? projectsData 
      : (projectsData?.data && Array.isArray(projectsData.data) ? projectsData.data : []);
    
    // Teams might be wrapped in { data: [...] } or direct array
    teams = Array.isArray(teamsData) 
      ? teamsData 
      : (teamsData?.data && Array.isArray(teamsData.data) ? teamsData.data : []);
    
    console.log("Processed projects:", projects.length);
    console.log("Processed teams:", teams.length, teams);
  } catch (error) {
    console.error("Failed to fetch data:", error);
  }

  return (
    <>
      <MainNav />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ProjectsClient initialProjects={projects} teams={teams} />
        </div>
      </div>
    </>
  );
}
