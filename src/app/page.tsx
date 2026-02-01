import { auth } from "@clerk/nextjs/server";
import { syncUser } from "@/lib/syncUser";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { MainNav } from "@/components/MainNav";

export default async function HomePage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/login");
  }

  const user = await syncUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation Header */}
      <MainNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <div className="inline-block p-4 bg-blue-100 dark:bg-blue-900 rounded-2xl mb-6">
            <div className="w-16 h-16 rounded-xl overflow-hidden shadow-inner">
              {user.imageUrl ? (
                <Image 
                  src={user.imageUrl} 
                  alt={user.name || 'User'} 
                  width={64}
                  height={64}
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="w-full h-full bg-blue-500 flex items-center justify-center text-white text-2xl font-bold">
                  {user.name?.[0]}
                </div>
              )}
            </div>
          </div>
          <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">
            Hello, {user.name}! 🚀
          </h2>
          <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-10">
            Great to see you again. Manage your teams, track your tasks, and collaborate with your peers all in one place.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link href="/teams" className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center mb-4">
                👥
              </div>
              <h3 className="text-lg font-bold mb-2 dark:text-white">Teams</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Manage your teams and collaborate with members.</p>
            </Link>
            <Link href="/projects" className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer">
              <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 rounded-lg flex items-center justify-center mb-4">
                📁
              </div>
              <h3 className="text-lg font-bold mb-2 dark:text-white">Projects</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">View and manage your current workspace projects.</p>
            </Link>
            <Link href="/chat" className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 rounded-lg flex items-center justify-center mb-4">
                💬
              </div>
              <h3 className="text-lg font-bold mb-2 dark:text-white">Chat</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Check your team discussions and project chats.</p>
            </Link>
            <Link href="/notifications" className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 rounded-lg flex items-center justify-center mb-4">
                🔔
              </div>
              <h3 className="text-lg font-bold mb-2 dark:text-white">Notifications</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Stay updated with all your notifications.</p>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
