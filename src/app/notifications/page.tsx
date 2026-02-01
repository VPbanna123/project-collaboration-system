import { notificationApi } from "@/lib/api-client";
import { NotificationsClient } from "./NotificationsClient";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { MainNav } from "@/components/MainNav";

export default async function NotificationsPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/login");
  }

  let notifications: any[] = [];
  let unreadCount = 0;
  
  try {
    const results = await Promise.all([
      notificationApi.getNotifications().catch(() => []),
      notificationApi.getUnreadCount().catch(() => ({ count: 0 })),
    ]);
    notifications = Array.isArray(results[0]) ? results[0] : [];
    unreadCount = (results[1] && typeof results[1].count === 'number') ? results[1].count : 0;
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    notifications = [];
    unreadCount = 0;
  }

  return (
    <>
      <MainNav />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <NotificationsClient
            initialNotifications={notifications}
            unreadCount={unreadCount}
          />
        </div>
      </div>
    </>
  );
}
