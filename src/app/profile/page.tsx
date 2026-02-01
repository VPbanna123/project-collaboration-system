import { auth } from "@clerk/nextjs/server";
import { UserProfile } from "@clerk/nextjs";
import { syncUser } from "@/lib/syncUser";
import { redirect } from "next/navigation";
import { MainNav } from "@/components/MainNav";

export default async function ProfilePage() {
    const { userId } = await auth();

    if (!userId) {
        redirect("/login");
    }

    const user = await syncUser();

    return (
        <>
        <MainNav />
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10">
            <div className="max-w-4xl mx-auto px-4">
                <div className="flex items-center justify-between mb-8 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Your Profile</h1>
                        <p className="text-gray-500 dark:text-gray-400">Manage your account settings and profile</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
                    <UserProfile routing="hash" />
                </div>

                <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                    <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-2">Database Sync Status</h2>
                    <p className="text-sm text-blue-700 dark:text-blue-400">
                        Current DB Image URL: <span className="font-mono break-all">{user?.imageUrl || "Not synced"}</span>
                    </p>
                    <p className="text-xs text-blue-500 dark:text-blue-400 mt-2 italic">
                        Note: If you change your profile picture above, it will be updated in our database the next time you load this page.
                    </p>
                </div>
            </div>
        </div>
        </>
    );
}
