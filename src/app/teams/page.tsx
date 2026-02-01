import { teamApi } from "@/lib/api-client";
import { TeamsClient } from "./TeamsClient";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { MainNav } from "@/components/MainNav";
import type { Team } from "@/types/api";

// Force dynamic rendering to always fetch fresh data
export const dynamic = 'force-dynamic';

export default async function TeamsPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/login");
  }

  let teams: Team[] = [];
  try {
    const result = await teamApi.getTeams().catch(() => ({ data: [] })) as { data?: Team[] };
    teams = Array.isArray(result?.data) ? result.data : (Array.isArray(result) ? result : []);
  } catch (error) {
    console.error("Failed to fetch teams:", error);
    teams = [];
  }

  return (
    <>
      <MainNav />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <TeamsClient initialTeams={teams} />
        </div>
      </div>
    </>
  );
}
