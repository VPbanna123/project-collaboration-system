import { projectApi } from "@/lib/api-client";
import { ChatClient } from "./ChatClient";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { MainNav } from "@/components/MainNav";
import { Project, Message } from "@/types/api";

export default async function ChatPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/login");
  }

  let projects: Project[] = [];
  let initialMessages: Message[] = [];
  
  try {
    const result = await projectApi.getProjects().catch(() => []);
    projects = Array.isArray(result) ? result : [];
    // If there are projects, load messages for the first one
    if (projects.length > 0) {
      // Note: We'll load messages on the client side for the selected project
      initialMessages = [];
    }
  } catch (error) {
    console.error("Failed to fetch data:", error);
    projects = [];
  }

  return (
    <>
      <MainNav />
      <div className="h-screen bg-gray-50 dark:bg-gray-900 pt-16">
        <ChatClient 
          initialMessages={initialMessages} 
          projects={projects}
          currentUserId={userId}
        />
      </div>
    </>
  );
}
