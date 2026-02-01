"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationBell } from "./NotificationBell";

interface ClientNavProps {
  userName: string;
}

export function ClientNav({ userName }: ClientNavProps) {
  return (
    <header className="bg-white dark:bg-gray-900 shadow-md sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo and Site Name */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-linear-to-br from-blue-600 to-indigo-600 rounded-lg shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <Link href="/" className="text-2xl font-bold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-indigo-700 transition-all">
              TeamManager
            </Link>
          </div>

          {/* Center: Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            <Link 
              href="/" 
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-800 rounded-lg font-medium transition-all"
            >
              Dashboard
            </Link>
            <Link 
              href="/teams" 
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-800 rounded-lg font-medium transition-all"
            >
              Teams
            </Link>
            <Link 
              href="/projects" 
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-800 rounded-lg font-medium transition-all"
            >
              Projects
            </Link>
            <Link 
              href="/chat" 
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-800 rounded-lg font-medium transition-all"
            >
              Chat
            </Link>
            <Link 
              href="/notifications" 
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-800 rounded-lg font-medium transition-all"
            >
              Notifications
            </Link>
          </nav>

          {/* Right: Theme Toggle, Notifications and Profile */}
          <div className="flex items-center gap-3">
            {userName && (
              <span className="text-sm text-gray-600 dark:text-gray-400 hidden md:inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <circle cx="10" cy="10" r="10" />
                </svg>
                {userName}
              </span>
            )}
            <ThemeToggle />
            <NotificationBell />
            <div className="border-l border-gray-300 dark:border-gray-700 h-8" />
            <UserButton afterSignOutUrl="/login" />
          </div>
        </div>
      </div>
    </header>
  );
}
